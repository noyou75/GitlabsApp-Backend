import { AbstractNotification, NotificationParameters } from '../notification';

export class SpecialistEnRouteNotification extends AbstractNotification {
  constructor() {
    super('specialist-en-route');
  }

  async getEmailParams(parameters?: NotificationParameters) {
    const subject = '🚗 Your Getlabs specialist is on the way';

    return {
      subject,
      parameters,
    };
  }
}
