import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { Process } from '@nestjs/bull';
import { AppointmentCancellationReason } from '../../../common/enums/appointment-cancellation-reason.enum';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AbstractQueue } from '../../job/types/abstract.queue';
import { NotificationService } from '../../notification/services/notification.service';
import { AppointmentService } from '../appointment.service';
import { AppointmentAutocancelNotification } from '../notifications/appointment-autocancel.notification';
import {
  AppointmentCancellationParams,
  AppointmentJobExecutionDescription,
  AppointmentJobOperationTypes,
} from './appointment-job.interface';
import { AppointmentQueueName } from './appointment-queue.config';
import { Processor, ProcessorType } from '../../job/decorators/processor.decorator';

/**
 * Job execution descriptor specifically for the auto cancel deferred task.
 */
interface AppointmentCancelJobExecutionDescription extends AppointmentJobExecutionDescription, AppointmentCancellationParams {}

/**
 * Queue processor for appointment tasks.
 */
@Processor({ name: AppointmentQueueName, type: ProcessorType.worker })
export class AppointmentQueue extends AbstractQueue {
  @Inject()
  private appointmentService: AppointmentService;

  @Inject()
  private notificationService: NotificationService;

  /**
   * This process implements the autocancel task.
   */
  @Process({
    name: AppointmentJobOperationTypes.autocancel,
  })
  async processAppointmentJob(job: Job<AppointmentCancelJobExecutionDescription>) {
    /* Resolve the appointment described by the supplied job data. */
    const appointment = await this.appointmentService.read(job.data.data.appointmentId);

    /* Validate that this appointment is in the proper state. */
    const errs = await this.appointmentService.validateAppointmentStatus(appointment, [
      AppointmentStatus.Pending,
      AppointmentStatus.Confirmed,
    ]);

    if (errs && errs.length > 0) {
      this.logJobWarning(
        job,
        'Cannot cancel appointment %s; the appointment status is already beyond Confirmed, and ' + 'is therefore non-cancellable.',
      );
      return;
    }

    /* If we get here, the appointment is cancellable - cancel the appointment. */
    await this.appointmentService.update(appointment, {
      status: AppointmentStatus.Cancelled,
      cancelReason: job.data.reason || AppointmentCancellationReason.NoLabOrder,
      cancelNote: job.data.note || 'Appointment cancelled automatically by the system.',
    });

    /* Dispatch a notification informing the patient that their appointment was cancelled. */
    await this.notificationService.send(AppointmentAutocancelNotification, appointment.patient, { appointment });
  }

  protected getQueueName(): string {
    return AppointmentQueueName;
  }
}
