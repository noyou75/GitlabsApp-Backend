import { Notification } from '../../notification/decorator/notification.decorator';
import { AbstractNotification, NotificationParameters, NotificationTypes } from '../../notification/notification';

/**
 * This notification alerts new patients who abandon the booking flow without scheduling an appointment.
 */
@Notification()
export class PatientIncompleteBookingNotification extends AbstractNotification {
  constructor() {
    super('patient-incomplete-booking', [NotificationTypes.SMS]);
  }

  public async getEmailParams(params?: NotificationParameters) {
    return {
      parameters: {},
      subject: '👋 Finish booking your visit - Save 15%',
    };
  }
}
