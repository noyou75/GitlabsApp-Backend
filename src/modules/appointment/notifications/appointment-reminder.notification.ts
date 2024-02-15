import { format } from 'util';
import { Notification } from '../../notification/decorator/notification.decorator';
import { AbstractAppointmentNotification, AppointmentNotificationParameters } from './abstract-appointment.notification';

/**
 * Represents a notification that reminds patients of upcoming appointments.
 */
@Notification()
export class AppointmentReminderNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-reminder');
  }

  protected async getAppointmentTemplateData(params?: AppointmentNotificationParameters) {
    const subject = format('📅 Appointment%s Reminder', params.appointment.patient.insurance.hasInsurance ? ' & Insurance' : '');

    return {
      subject,
      data: {
        subject,
        appointment: params.appointment,
      },
    };
  }
}
