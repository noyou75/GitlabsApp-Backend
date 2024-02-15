import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationEmailParameters, NotificationParameters, NotificationTypes } from '../notification';

@Notification()
export class CancelledAppointmentFeedbackNotification extends AbstractNotification {
  constructor() {
    super('cancelled-appointment-feedback', [NotificationTypes.Email]);
  }

  async getEmailParams(params?: NotificationParameters): Promise<NotificationEmailParameters> {
    const subject = 'Cancelled Appointment: Feedback';

    return {
      subject,
      parameters: params,
    };
  }
}
