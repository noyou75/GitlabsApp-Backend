import { AbstractAppointmentNotification } from '../../appointment/notifications/abstract-appointment.notification';
import { Notification } from '../decorator/notification.decorator';
import { NotificationParameters } from '../notification';

@Notification()
export class NewAppointmentForPatientNotification extends AbstractAppointmentNotification {
  constructor() {
    super('new-appointment-for-patient');
  }

  async getAppointmentTemplateData(parameters?: NotificationParameters) {
    const subject = '✅ Your visit is now confirmed';

    return {
      subject,
      data: parameters,
    };
  }
}
