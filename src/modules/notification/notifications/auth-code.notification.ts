import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationParameters, NotificationTypes } from '../notification';

@Notification()
export class AuthCodeNotification extends AbstractNotification {
  constructor() {
    super('auth-code', [NotificationTypes.SMS, NotificationTypes.Voice, NotificationTypes.Email]);
  }

  async getEmailParams(parameters: NotificationParameters) {
    return {
      subject: 'Your Getlabs Authentication Code',
      parameters,
    };
  }
}
