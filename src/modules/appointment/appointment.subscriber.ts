import { Inject, Injectable } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { includesColumn, includesRelation } from '../../common/entity.utils';
import { AppointmentCancellationReason } from '../../common/enums/appointment-cancellation-reason.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { ConfigService } from '../core/services/config.service';
import { EntitySubscriber } from '../entity/subscriber/entity.subscriber';
import { AppointmentTimeChangeForPatientNotification } from '../notification/notifications/appointment-time-change-for-patient.notification';
import { AppointmentTimeChangeForSpecialistNotification } from '../notification/notifications/appointment-time-change-for-specialist.notification';
import { NewAppointmentForSpecialistNotification } from '../notification/notifications/new-appointment-for-specialist.notification';
import { SpecialistEnRouteNotification } from '../notification/notifications/specialist-en-route.notification';
import { NotificationService } from '../notification/services/notification.service';
import { SlackService } from '../slack/slack.service';
import { TemplatingService } from '../templating/services/templating.service';
import { UserService } from '../user/user.service';
import { AppointmentService } from './appointment.service';
import { generateIdentifier } from './appointment.utils';
import { AppointmentCancelledForPatientNotification } from './notifications/appointment-cancelled-for-patient.notification';
import { AppointmentCancelledForSpecialistNotification } from './notifications/appointment-cancelled-for-specialist.notification';
import { AppointmentJobService } from './service/appointment-job.service';

@Injectable()
@EventSubscriber()
export class AppointmentSubscriber extends EntitySubscriber(AppointmentEntity) {
  @Inject()
  private readonly config: ConfigService;

  @Inject()
  private readonly appointments: AppointmentService;

  @Inject()
  private readonly notifications: NotificationService;

  @Inject()
  private readonly templating: TemplatingService;

  @Inject()
  private readonly slack: SlackService;

  @Inject()
  private readonly appointmentNotification: AppointmentJobService;

  @Inject()
  private readonly userService: UserService;

  async beforeInsert(event: InsertEvent<AppointmentEntity>) {
    // Generate unique identifier code
    await this.generateIdentifier(event.entity);

    // Update status history
    await this.updateStatusDate(event.entity);
    await this.updateStatusHistory(event.entity);

    await super.beforeInsert(event);
  }

  async afterInsert(event: InsertEvent<AppointmentEntity>) {
    await this.appointmentNotification.setDeferredAppointmentTasks(event.entity);

    /* Cancel any deferred appointment-related tasks that belong to the incomplete booking flow namespace */
    await this.appointmentNotification.cancelDeferredAppointmentTasks(
      event.entity,
      AppointmentJobService.JobNamespaces.IncompleteBookingFlow,
    );

    await super.afterInsert(event);
  }

  async beforeUpdate(event: UpdateEvent<AppointmentEntity>) {
    const entity = event.entity;
    if (entity instanceof AppointmentEntity) {
      if (includesColumn(event.updatedColumns, 'status')) {
        await this.updateStatusDate(entity);
        await this.updateStatusHistory(entity);

        if (entity.status === AppointmentStatus.EnRoute) {
          await this.notifications.send(SpecialistEnRouteNotification, event.entity.patient, { appointment: event.entity });
        }

        if (entity.status === AppointmentStatus.Cancelled) {
          await this.handleAppointmentCancel(entity);
        }
      }
    }

    super.beforeUpdate(event);
  }

  async afterUpdate(event: UpdateEvent<AppointmentEntity>) {
    const entity = event.entity;

    if (entity.status !== AppointmentStatus.Cancelled) {
      const hasUpdatedTimes = includesColumn(event.updatedColumns, ['startAt', 'endAt']);
      const hasUpdatedSpecialist = includesRelation(event.updatedRelations, 'specialist');

      if (hasUpdatedTimes) {
        // Time changed, so send the patient a time change notification
        await this.notifications.send(AppointmentTimeChangeForPatientNotification, event.entity.patient, { appointment: event.entity });

        /* Cancel and reschedule all existing notification jobs.  Operations run in the background and need not block
         * the thread. */
        this.appointmentNotification
          .cancelDeferredAppointmentTasks(entity as AppointmentEntity)
          .then(() => this.appointmentNotification.setDeferredAppointmentTasks(entity as AppointmentEntity));

        if (entity.specialist) {
          if (hasUpdatedSpecialist) {
            // Time changed and specialist changed, so send the specialist a new appointment notification
            await this.notifications.send(NewAppointmentForSpecialistNotification, event.entity.specialist, { appointment: event.entity });

            // TODO: This should probably send a cancellation notification to the previous specialist as well
          } else {
            // Time changed but specialist is the same, so send the specialist a time change notification
            await this.notifications.send(AppointmentTimeChangeForSpecialistNotification, event.entity.specialist, {
              appointment: event.entity,
            });
          }
        }
      } else {
        if (entity.specialist && hasUpdatedSpecialist) {
          // Time did not change, but specialist changed, so send the specialist a new appointment notification
          await this.notifications.send(NewAppointmentForSpecialistNotification, event.entity.specialist, { appointment: event.entity });

          // TODO: This should probably send a cancellation notification to the previous specialist as well
        }
      }
    }

    super.afterUpdate(event);
  }

  // ---

  private async generateIdentifier(appointment: AppointmentEntity): Promise<void> {
    if (!appointment.identifier) {
      appointment.identifier = await generateIdentifier();
    }
  }

  private async handleAppointmentCancel(appointment: AppointmentEntity) {
    /* If this appointment is refundable, issue a refund... */
    const isRefundable = await this.issueRefund(appointment);

    await this.appointmentNotification.cancelDeferredAppointmentTasks(appointment);

    /* Dispatch a message to the patient informing them of their cancelled appointment */
    if (appointment.cancelReason !== AppointmentCancellationReason.Rebooked) {
      /* Dispatch a message to the patient informing them of their cancelled appointment */
      await this.notifications.send(AppointmentCancelledForPatientNotification, appointment.patient, {
        isRefundable,
        appointment,
      });
      await this.notifications.send(AppointmentCancelledForSpecialistNotification, appointment.specialist, {
        appointment,
      });
    }
  }

  private async updateStatusDate(appointment: AppointmentEntity): Promise<void> {
    appointment.statusDate = new Date();
  }

  private async updateStatusHistory(appointment: AppointmentEntity): Promise<void> {
    appointment.statusHistory = [
      ...(appointment.statusHistory ?? []),
      {
        status: appointment.status,
        createdAt: new Date(),
      },
    ];
  }

  private async issueRefund(appointment: AppointmentEntity): Promise<boolean> {
    // Automatic refund if the appointment has not been rebooked and start time is more than 24 hours out (minus 15 min grace period)
    const refundable = !appointment.rebookedTo && differenceInMinutes(appointment.startAt, new Date()) >= 60 * 24 - 15;

    if (refundable) {
      await this.appointments.refund(
        appointment,
        appointment.cancelReason === AppointmentCancellationReason.Other ? `other: ${appointment.cancelNote}` : appointment.cancelReason,
      );
    }

    return refundable;
  }
}
