import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationTypes } from '../notification';

@Notification()
export class ContinueInsuranceOnMobileNotification extends AbstractNotification {
  constructor() {
    super('continue-insurance-on-mobile', [NotificationTypes.SMS]);
  }

  async getEmailParams(params?: { [p: string]: any }) {
    return undefined;
  }
}
