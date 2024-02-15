import { Notification } from '../../notification/decorator/notification.decorator';
import { NotificationParameters } from '../../notification/notification';
import { AbstractAppointmentNotification } from './abstract-appointment.notification';

/**
 * This notification alerts patients when their appointment has been refunded (but not cancelled).
 */
@Notification()
export class AppointmentRefundedNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-refunded');
  }

  protected async getAppointmentTemplateData(params?: NotificationParameters) {
    return {
      subject: '🙌 Your appointment has been refunded.',
    };
  }
}
