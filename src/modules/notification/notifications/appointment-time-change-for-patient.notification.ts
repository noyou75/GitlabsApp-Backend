import { AbstractAppointmentNotification } from '../../appointment/notifications/abstract-appointment.notification';
import { Notification } from '../decorator/notification.decorator';
import { NotificationParameters } from '../notification';

@Notification()
export class AppointmentTimeChangeForPatientNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-time-change-for-patient');
  }

  async getAppointmentTemplateData(parameters?: NotificationParameters) {
    const subject = '➡️ Your visit time has changed';

    return {
      subject,
      data: parameters,
    };
  }
}
