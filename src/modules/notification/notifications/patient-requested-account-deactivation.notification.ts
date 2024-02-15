import { Notification } from '../decorator/notification.decorator';
import { AbstractNotification, NotificationParameters } from '../notification';

@Notification()
export class PatientRequestedAccountDeactivationNotification extends AbstractNotification {
  constructor() {
    super('patient-requested-account-deactivation');
  }

  async getEmailParams(parameters?: NotificationParameters) {
    const subject = '✌️ Your account has been deactivated';

    return {
      subject,
      parameters,
    };
  }
}
