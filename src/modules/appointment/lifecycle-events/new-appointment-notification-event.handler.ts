import { isEqual } from "date-fns";
import { isSameEntity } from '../../../common/entity.utils';
import { REQUEST_CONTEXT_IP_ADDRESS, RequestContext } from '../../../common/request-context';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { SlackConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { EntityLifecycleEvent, EntityLifecycleEventHandler, EntityLifecycleEventTypes } from '../../entity/services/entity-subscriber.service';
import { JobExecutionDescription } from '../../job/services/abstract-queue.service';
import { AppointmentTimeChangeForPatientNotification } from '../../notification/notifications/appointment-time-change-for-patient.notification';
import { AppointmentTimeChangeForSpecialistNotification } from '../../notification/notifications/appointment-time-change-for-specialist.notification';
import { NewAppointmentForPatientNotification } from '../../notification/notifications/new-appointment-for-patient.notification';
import { NewAppointmentForSpecialistNotification } from '../../notification/notifications/new-appointment-for-specialist.notification';
import { NotificationService } from '../../notification/services/notification.service';
import { SlackService } from '../../slack/slack.service';
import { AppointmentService } from '../appointment.service';
import { NewAppointmentSlackNotificationTemplate } from '../templates/new-appointment-slack-notification.template';

/**
 * Appointment creation lifecycle event handler that's responsible for dispatching the various notifications associated with appointment creation.  Will be called
 * out-of-band.
 */
@EntityLifecycleEvent(AppointmentEntity, EntityLifecycleEventTypes.Created, {
  executeOn: 'afterTransactionCommit',
  runAsJob: true,
})
export class NewAppointmentNotificationEventHandler implements EntityLifecycleEventHandler<AppointmentEntity> {
  constructor(
    private readonly configService: ConfigService,
    private readonly slackService: SlackService,
    private readonly appointmentService: AppointmentService,
    private readonly notificationService: NotificationService,
  ) {

  }

  async handle(
    event: EntityLifecycleEventTypes,
    entityDetails: {
      newEntity: AppointmentEntity,
    },
    eventContext?: JobExecutionDescription<never>,
  ) {
    const newEntity = entityDetails.newEntity;

    if (newEntity.rebookedFrom) {
      if (
        !isEqual(newEntity.startAt, newEntity.rebookedFrom.startAt) ||
        !isEqual(newEntity.endAt, newEntity.rebookedFrom.endAt)
      ) {
        // Time changed, so send the patient a time change notification
        await this.notificationService.send(AppointmentTimeChangeForPatientNotification, newEntity.patient, { appointment: newEntity });

        if (newEntity.specialist && isSameEntity(newEntity.specialist, newEntity.rebookedFrom.specialist)) {
          // Time changed but specialist is the same, so send the specialist a time change notification
          await this.notificationService.send(AppointmentTimeChangeForSpecialistNotification, newEntity.specialist, {
            appointment: newEntity,
          });
        }
      } else {
        if (newEntity.specialist && !isSameEntity(newEntity.specialist, newEntity.rebookedFrom.specialist)) {
          // Time did not change, but specialist changed, so send the specialist a new appointment notification
          await this.notificationService.send(NewAppointmentForSpecialistNotification, newEntity.specialist, { appointment: newEntity });
        }
      }
    } else {
      // New appointment, so send notifications to everyone
      await this.notificationService.send(NewAppointmentForPatientNotification, newEntity.patient, { appointment: newEntity });

      if (newEntity.specialist) {
        await this.notificationService.send(NewAppointmentForSpecialistNotification, newEntity.specialist, { appointment: newEntity });
      }

      /* The appointments notification needs to run asynchronously, as it involves other asynchronous tasks. */
      await this.slackService.send(this.configService.get(SlackConfig.AppointmentsChannel), NewAppointmentSlackNotificationTemplate, {
        appointment: newEntity,

        /* If the event context object is populated by virtue of being executed through a job, populate the 'IP' field with the event
         * context's 'ip' property.  Otherwise, use the current request IP address. */
        ip: eventContext.ip || RequestContext.get(REQUEST_CONTEXT_IP_ADDRESS),
      });
    }
  }
}
