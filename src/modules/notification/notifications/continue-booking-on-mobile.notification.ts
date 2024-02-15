import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationParameters, NotificationTypes } from '../notification';

@Notification()
export class ContinueBookingOnMobileNotification extends AbstractNotification {
  constructor() {
    super('continue-booking-on-mobile', [NotificationTypes.SMS]);
  }

  getEmailParams(params?: NotificationParameters) {
    return undefined;
  }
}
