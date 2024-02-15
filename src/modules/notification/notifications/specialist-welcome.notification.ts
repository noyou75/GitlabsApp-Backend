import { AbstractNotification, NotificationParameters } from '../notification';

export class SpecialistWelcomeNotification extends AbstractNotification {
  constructor() {
    super('specialist-welcome');
  }

  async getEmailParams(parameters?: NotificationParameters) {
    const subject = '🎉 Your Getlabs Care account is ready!';

    return {
      subject,
      parameters,
    };
  }
}
