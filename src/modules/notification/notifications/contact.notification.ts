import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationEmailParameters, NotificationParameters, NotificationTypes } from '../notification';

@Notification()
export class ContactNotification extends AbstractNotification {
  constructor() {
    super('contact', [NotificationTypes.Email]);
  }

  async getEmailParams(params?: NotificationParameters): Promise<NotificationEmailParameters> {
    return {
      subject: `Contact Request from ${params.name}`,
      parameters: params,
    };
  }
}
