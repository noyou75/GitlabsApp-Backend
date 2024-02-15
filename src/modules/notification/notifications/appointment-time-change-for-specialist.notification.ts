import { AbstractAppointmentNotification } from '../../appointment/notifications/abstract-appointment.notification';
import { Notification } from '../decorator/notification.decorator';
import { NotificationParameters } from '../notification';

@Notification()
export class AppointmentTimeChangeForSpecialistNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-time-change-for-specialist');
  }

  async getAppointmentTemplateData(parameters?: NotificationParameters) {
    const subject = '➡️ Appointment Time Changed';

    return {
      subject,
      data: parameters,
    };
  }
}
