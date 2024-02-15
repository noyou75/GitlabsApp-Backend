import { format } from 'date-fns';
import { Notification } from '../../../notification/decorator/notification.decorator';
import {
  AbstractNotification,
  NotificationEmailParameters,
  NotificationParameters,
  NotificationTypes,
} from '../../../notification/notification';

export interface ReferrerDailyReportNotificationParameters extends NotificationParameters {
  date: Date;
  expiry: Date;
  link: string;
  tz: string;
}

@Notification()
export class ReferrerDailyReportNotification extends AbstractNotification {
  constructor() {
    super('daily-appointment-report', [NotificationTypes.Email]);
  }

  async getEmailParams(parameters?: ReferrerDailyReportNotificationParameters): Promise<NotificationEmailParameters> {
    return {
      subject: `Labcorp Daily Appointments Report for ${format(parameters.date, 'M/d')} Ready`,
      parameters,
    };
  }
}
