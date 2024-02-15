import { AppointmentCancellationReason } from '../../../common/enums/appointment-cancellation-reason.enum';
import { Notification } from '../../notification/decorator/notification.decorator';
import { NotificationParameters } from '../../notification/notification';
import { AbstractAppointmentNotification } from './abstract-appointment.notification';

export interface AppointmentCancelledForPatientNotificationParameters extends NotificationParameters {
  isRefundable: boolean;
}

/**
 * This notification informs patients when their appointment is cancelled.
 */
@Notification()
export class AppointmentCancelledForPatientNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-cancelled-for-patient');
  }

  protected async getAppointmentTemplateData(params?: NotificationParameters) {
    const subject = '☝️ Your visit is now cancelled';

    return {
      subject,
      data: {
        patientReasons: [
          AppointmentCancellationReason.LabOrderUnclear,
          AppointmentCancellationReason.NoAnswer,
          AppointmentCancellationReason.NoConfirm,
        ],
        isRefundable: params.isRefundable,
        appointment: params.appointment,
      },
    };
  }
}
