import { Notification } from '../../notification/decorator/notification.decorator';
import { AbstractAppointmentNotification, AppointmentNotificationParameters } from './abstract-appointment.notification';

/**
 * Notification that is sent to users when their appointment is automatically cancelled due to a missing
 * lab order.
 */
@Notification()
export class AppointmentAutocancelNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-autocancel');
  }

  protected async getAppointmentTemplateData(params?: AppointmentNotificationParameters) {
    const subject = "☝️ We didn't receive your lab order in time";

    return {
      subject,
      data: {
        subject,
        appointment: params.appointment,
      },
    };
  }
}
