import { Notification } from '../../notification/decorator/notification.decorator';
import { AbstractNotification, NotificationTypes } from '../../notification/notification';

@Notification()
export class ReferredAppointmentAwardNotification extends AbstractNotification {
  constructor() {
    super('referred-appointment-award', [NotificationTypes.SMS])
  }

  getEmailParams() {
    return null;
  }
}
