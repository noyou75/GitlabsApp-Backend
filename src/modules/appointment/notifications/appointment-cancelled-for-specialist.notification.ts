import { Notification } from '../../notification/decorator/notification.decorator';
import { NotificationParameters } from '../../notification/notification';
import { AbstractAppointmentNotification } from './abstract-appointment.notification';

/**
 * This notification informs specialists when one of their appointments has been cancelled
 */
@Notification()
export class AppointmentCancelledForSpecialistNotification extends AbstractAppointmentNotification {
  constructor() {
    super('appointment-cancelled-for-specialist');
  }

  protected async getAppointmentTemplateData(params?: NotificationParameters) {
    return {
      subject: '☝️ One of your appointments was cancelled.',
      data: {
        appointment: params.appointment,
      },
    };
  }
}
