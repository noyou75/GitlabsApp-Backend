import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationParameters } from '../notification';

@Notification()
export class WelcomeNotification extends AbstractNotification {
  constructor() {
    super('welcome');
  }

  async getEmailParams(parameters?: NotificationParameters) {
    const subject = '👋 Welcome to Getlabs!';

    return {
      subject,
      parameters,
    };
  }
}
