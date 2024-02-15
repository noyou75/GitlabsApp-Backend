import { AbstractAppointmentNotification } from '../../appointment/notifications/abstract-appointment.notification';
import { Notification } from '../decorator/notification.decorator';
import { NotificationParameters } from '../notification';

@Notification()
export class NewAppointmentForSpecialistNotification extends AbstractAppointmentNotification {
  constructor() {
    super('new-appointment-for-specialist');
  }

  async getAppointmentTemplateData(parameters?: NotificationParameters) {
    const subject = "🎉 You've been booked for a new appointment!";

    return {
      subject,
      data: parameters,
    };
  }
}
