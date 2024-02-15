import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppointmentAwardsModule } from './appointment-awards/appointment-awards.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { AwardsModule } from './awards/awards.module';
import { CommandModule } from './command/command.module';
import { ContactModule } from './contact/contact.module';
import { CoreModule } from './core/core.module';
import { CouponModule } from './coupon/coupon.module';
import { DatabaseModule } from './database/database.module';
import { EntityModule } from './entity/entity.module';
import { FileModule } from './file/file.module';
import { HealthModule } from './health/health.module';
import { JobModule } from './job/job.module';
import { LabOrderDetailsModule } from './lab-order-details/lab-order-details.module';
import { LocaleModule } from './locale/locale.module';
import { MarketModule } from './market/market.module';
import { MarketingModule } from './marketing/marketing.module';
import { NotificationModule } from './notification/notification.module';
import { PatientCreditModule } from './patient-credit/patient-credit.module';
import { PeerReferrerModule } from './peer-referrer/peer-referrer.module';
import { ProviderModule } from './providers/provider.module';
import { QueueModule } from './queue/queue.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RecaptchaModule } from './recaptcha/recaptcha.module';
import { ReferrerModule } from './referrer/referrer.module';
import { SlackModule } from './slack/slack.module';
import { TemplatingModule } from './templating/templating.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';
import { CitiesModule } from './cities/cities.module';

@Module({
  imports: [
    AnalyticsModule.registerAsync(),
    AvailabilityModule,
    ApiModule,
    AuditLogModule,
    AuthModule,
    AwardsModule,
    AppointmentAwardsModule,
    AppointmentModule,
    CommandModule,
    ContactModule,
    CoreModule,
    CouponModule,
    DatabaseModule,
    EntityModule,
    FileModule,
    HealthModule,
    JobModule,
    LabOrderDetailsModule,
    LocaleModule,
    MarketModule,
    MarketingModule,
    NotificationModule,
    PeerReferrerModule,
    ProviderModule,
    QueueModule,
    RateLimitModule,
    RecaptchaModule,
    ReferrerModule,
    SlackModule,
    TemplatingModule,
    UserModule,
    WebhookModule,
    PatientCreditModule,
    CitiesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
