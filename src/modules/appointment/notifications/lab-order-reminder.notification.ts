import { Notification } from '../../notification/decorator/notification.decorator';
import { AbstractAppointmentNotification, AppointmentNotificationParameters } from './abstract-appointment.notification';

/**
 * Notification that is sent to patients who have elected to have their doctor submit their lab order.
 */
@Notification()
export class LabOrderReminderNotification extends AbstractAppointmentNotification {
  constructor() {
    super('lab-order-reminder');
  }

  protected async getAppointmentTemplateData(params?: AppointmentNotificationParameters) {
    const subject = "👋 Getlabs hasn't yet received your lab order";
    return {
      subject,
      data: {
        appointment: params.appointment,
        cutoffDate: params.appointment.getLabOrderDeadline(),
      },
    };
  }
}
