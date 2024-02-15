import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { CommandModule } from '../command/command.module';
import { MarketModule } from '../market/market.module';
import { NotificationModule } from '../notification/notification.module';
import { ReportingModule } from '../reporting/reporting.module';
import { SharedModule } from '../shared/shared.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { LabcorpReferrer } from './referrers/labcorp.referrer';
import { ReferrerDailyReportNotification } from './report/daily-appointments/referrer-daily-report.notification';
import { ReferralReportCommand } from './report/referral-report.command';
import { ReferrerDailyAppointmentsCommand } from './report/daily-appointments/referrer-daily-appointments.command';
import { ReferrerService } from './service/referrer.service';

@Module({
  imports: [
    ReportingModule,
    AppointmentModule,
    AnalyticsModule,
    CommandModule,
    PatientUserModule,
    SharedModule,
    NotificationModule,
    MarketModule,
  ],
  providers: [
    ReferralReportCommand,
    ReferrerDailyAppointmentsCommand,
    ReferrerService,
    LabcorpReferrer,
    ReferrerDailyReportNotification,
  ],
})
export class ReferrerModule {}
