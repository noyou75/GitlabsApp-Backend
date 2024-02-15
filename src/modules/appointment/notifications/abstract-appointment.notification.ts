import { getRepository } from 'typeorm';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import {
  AbstractNotification,
  NotificationEmailParameters,
  NotificationParameters,
  NotificationTypes,
} from '../../notification/notification';

/**
 * Describes dynamic data that will be injected into the notification template when the notification
 * text is assembled.
 */
export interface AppointmentNotificationTemplateData {
  subject: string;
  data?: object;
}

/**
 * Extends the base NotificationParameters by including a property for the appointment to which this
 * notification refers.
 */
export interface AppointmentNotificationParameters extends NotificationParameters {
  appointment: AppointmentEntity;
}

/**
 * Superclass for the various appointment notifications - this superclass handles all of the boilerplate tasks associated with
 * implementing appointment notifications.
 */
export abstract class AbstractAppointmentNotification extends AbstractNotification {
  protected constructor(notificationName: string) {
    super(notificationName);
  }

  async getEmailParams(params?: NotificationParameters): Promise<NotificationEmailParameters> {
    const details = await this.getAppointmentTemplateData({
      ...params,
      appointment: params.appointment || (await getRepository(AppointmentEntity).findOneOrFail(params.appointmentId)),
    });

    return {
      subject: details.subject,
      parameters: details.data,
    };
  }

  async renderSMS(params?: NotificationParameters): Promise<string | undefined> {
    const details = await this.getAppointmentTemplateData({
      ...params,
      appointment: params.appointment || (await getRepository(AppointmentEntity).findOneOrFail(params.appointmentId)),
    });

    return this[NotificationTypes.SMS](details.data);
  }

  /**
   * Retrieves the template data that applies to a given implementing notification.  This method will
   * be called with AppointmentNotificationParams, which includes the applicable appointment.
   */
  protected abstract getAppointmentTemplateData(
    params?: AppointmentNotificationParameters,
  ): Promise<AppointmentNotificationTemplateData>;
}
