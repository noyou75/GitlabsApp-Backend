import { Inject, Injectable, Type } from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { LabOrderSeedTypes } from '../../../entities/lab-order-details.entity';
import { PatientUser, User } from '../../../entities/user.entity';
import { JobDomain, JobScheduleInterface } from '../../job/decorators/job-domain.decorator';
import { RepeatType } from '../../job/types/repeat-type';
import { INotification } from '../../notification/notification';
import { NotificationJobSchedulerService } from '../../notification/services/notification-job-scheduler.service';
import { NotificationJobDescription } from '../../notification/services/notification-queue.service';
import { PatientContactHours } from '../../shared/util/time.util';
import { AppointmentReminderNotification } from '../notifications/appointment-reminder.notification';
import { PatientIncompleteBookingNotification } from '../notifications/patient-incomplete-booking.notification';
import { AppointmentJobSchedulerService } from './appointment-job-scheduler.service';

/**
 * AppointmentNotificationService
 * Appointment-tier Abstraction for creating repeatable notifications specifically for appointments.
 */
@JobScheduleInterface()
@Injectable()
export class AppointmentJobService {
  static readonly AppointmentDomain = 'AppointmentDomain';

  /**
   * Defines the various job namespaces (i.e. functional groups) under which we will schedule appt jobs.
   */
  public static readonly JobNamespaces = {
    [LabOrderSeedTypes.DoctorSubmit.type]: LabOrderSeedTypes.DoctorSubmit.type,
    IncompleteBookingFlow: 'INCOMPLETE_BOOKING_FLOW',
  };

  @Inject()
  @JobDomain(AppointmentJobService.AppointmentDomain)
  private notificationJobSchedulerService: NotificationJobSchedulerService;

  @Inject()
  private appointmentJobSchedulerService: AppointmentJobSchedulerService;

  /**
   * Schedules the various deferred tasks that relate to an appointment; should be executed upon appointment creation.
   */
  // TODO - we may have to think about abstracting this another layer (i.e. creating classes to describe individual jobs /
  //  job groupings)... we don't need it just yet, but this service may start to become bloated soon.
  public async setDeferredAppointmentTasks(appointment: AppointmentEntity) {
    const promises = new Array<Promise<any>>();

    /* Set the appointment reminder deferred task for all appointments */
    promises.push(this.setAppointmentReminderNotifications(appointment));

    /* If the appointment's lab order type is doctor submit, set the lab order reminder notification. */
    // Code is presently inactive, as the doctor submit workflow no longer occurs in production.  Leaving in place
    // in the event we decide to re-introduce the doctor submit workflow in the future.
    // if (appointment.labOrderDetails.getLabOrderType() === LabOrderSeedTypes.DoctorSubmit) {
    //   promises.push(this.setLabOrderReminderNotifications(appointment));
    //   promises.push(this.setAutoCancelTask(appointment));
    // }

    return Promise.all(promises);
  }

  /**
   * Schedules a notification that alerts patients abandoning the booking workflow without scheduling an appointment.
   */
  public async setIncompleteBookingReminder(user: User) {
    /* Form a job description for invoking the patient incomplete booking notification */
    const jobDesc: NotificationJobDescription = {
      data: {
        notification: PatientIncompleteBookingNotification,
      },
      recipient: user,
    };

    /* If there is another version of this job existing (i.e. as a result of a refresh or whatever else), cancel the existing job
     * before invoking the next job scheduling. */
    await this.notificationJobSchedulerService.cancelJob(jobDesc);
    return await this.notificationJobSchedulerService.scheduleJob(
      jobDesc,
      AppointmentJobService.JobNamespaces.IncompleteBookingFlow,
      addMinutes(new Date(), 30),
      user.timezone,
    );
  }

  /**
   * Cancels all deferred tasks that relate to the supplied appointment.
   */
  async cancelDeferredAppointmentTasks(appointment: AppointmentEntity, namespace?: string) {
    /* Cancel all deferred notifications that relate to this appointment */
    await this.notificationJobSchedulerService.cancelJob(
      {
        data: null,
        recipient: appointment.patient,
      },
      namespace,
    );

    /* Cancel all appointment tasks relating to this appointment. */
    await this.appointmentJobSchedulerService.cancelJob(
      {
        data: appointment,
      },
      namespace,
    );
  }

  /**
   * @description
   * Sets a repeating notification (via job scheduling) for reminding patients of their upcoming appointment.  Notification job IDs are
   * stored in Redis against the appointment ID.
   */
  private async setAppointmentReminderNotifications(appointment: AppointmentEntity) {
    await this.setAppointmentNotification(appointment, AppointmentReminderNotification);
  }

  /* Code is presently inactive, as the doctor submit workflow no longer occurs in production.  Leaving in place
   * in the event we decide to re-introduce the doctor submit workflow in the future. */
  /**
   * Sets the lab order reminder notification, which reminds patients to ask their provider to remit their lab order ASAP.
   * Runs under the namespace described by the doctor submission lab provisioning subworkflow.
   */
  // private async setLabOrderReminderNotifications(appointment: AppointmentEntity) {
  //   /* Queue a repeatable job every 24 hours (excluding today) that will dispatch a reminder to the pt to have their
  //    * hcp submit their lab order. */
  //   await this.setAppointmentNotification(
  //     appointment,
  //     LabOrderReminderNotification,
  //     AppointmentJobService.JobNamespaces[LabOrderSeedTypes.DoctorSubmit.type],
  //     RepeatType.EveryBusinessDay,
  //   );
  // }
  //

  /* Code is presently inactive, as the doctor submit workflow no longer occurs in production.  Leaving in place
   * in the event we decide to re-introduce the doctor submit workflow in the future. */
  /**
   * Sets a deferred task to automatically cancel the appointment if a lab order is not supplied by the cutoff date.
   * Runs under the namespace described by the doctor submission lab provisioning subworkflow.
   */
  // private async setAutoCancelTask(appointment: AppointmentEntity) {
  //   await this.appointmentJobSchedulerService.scheduleJob(
  //     {
  //       data: appointment,
  //       name: AppointmentJobOperationTypes.autocancel,
  //       reason: AppointmentCancellationReason.NoLabOrder,
  //       note: 'Appointment cancelled automatically by the system due to a missing lab order.',
  //     } as CancelAppointmentJobDescription,
  //     AppointmentJobService.JobNamespaces[LabOrderSeedTypes.DoctorSubmit.type],
  //     subHours(appointment.startAt, 8),
  //   );
  // }

  /**
   * Initiates a repeated notification task with the supplied parameters.
   */
  private async setAppointmentNotification(
    appointment: AppointmentEntity,
    notification: Type<INotification>,
    namespace?: string,
    repeatType = RepeatType.Asymptotic,
    recipient: User = appointment.patient,
  ) {
    /* Schedule a notification job for the supplied notif type. */
    await this.notificationJobSchedulerService.scheduleRepeatJob(
      {
        data: {
          notification,
          params: {
            appointmentId: appointment.id,
          },
        },
        recipient,
        strikeDate: appointment.startAt,
        timezone: recipient.timezone,
        acceptableSchedulingHours: recipient instanceof PatientUser ? PatientContactHours : null,
      },
      namespace,
      repeatType,
    );
  }
}
