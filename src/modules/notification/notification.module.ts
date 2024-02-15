import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { MailConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { LoggerService } from '../core/services/logger.service';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { SharedModule } from '../shared/shared.module';
import { SlackModule } from '../slack/slack.module';
import { TemplatingModule } from '../templating/templating.module';
import { UserModule } from '../user/user.module';
import { NotificationQueue } from './job/notification.queue';
import { AuthCodeNotification } from './notifications/auth-code.notification';
import { CancelledAppointmentFeedbackNotification } from './notifications/cancelled-appointment-feedback.notification';
import { ContinueBookingOnMobileNotification } from './notifications/continue-booking-on-mobile.notification';
import { NewAppointmentForPatientNotification } from './notifications/new-appointment-for-patient.notification';
import { NewAppointmentForSpecialistNotification } from './notifications/new-appointment-for-specialist.notification';
import { PatientRequestedAccountDeactivationNotification } from './notifications/patient-requested-account-deactivation.notification';
import { WelcomeNotification } from './notifications/welcome.notification';
import { MailerService } from './services/mailer.service';
import { NotificationJobSchedulerService } from './services/notification-job-scheduler.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationTypeService } from './services/notification-type.service';
import { NotificationService } from './services/notification.service';
import { TextMessagingService } from './services/text-messaging.service';
import { VoiceMessagingService } from './services/voice-messaging.service';

@Module({
  imports: [
    SharedModule,
    RateLimitModule,
    TemplatingModule,
    BullModule.registerQueue({
      name: NotificationQueue.QueueName,
    }),
    DiscoveryModule,
    forwardRef(() => UserModule),
    SlackModule,
  ],
  providers: [
    NotificationService,
    TextMessagingService,
    VoiceMessagingService,
    {
      provide: MailerService,
      useFactory: (config: ConfigService, rateLimit: RateLimitService, logger: LoggerService) => {
        return new MailerService(
          config.get(MailConfig.SMTPTransport),
          {
            from: '"Getlabs" <hello@getlabs.com>',
          },
          rateLimit,
          config,
          logger,
        );
      },
      inject: [ConfigService, RateLimitService, LoggerService],
    },
    NotificationQueue,
    NotificationQueueService,
    AuthCodeNotification,
    CancelledAppointmentFeedbackNotification,
    ContinueBookingOnMobileNotification,
    NewAppointmentForPatientNotification,
    NewAppointmentForSpecialistNotification,
    PatientRequestedAccountDeactivationNotification,
    WelcomeNotification,
    NotificationTypeService,
    NotificationJobSchedulerService,
  ],
  exports: [
    NotificationService,
    MailerService,
    TextMessagingService,
    VoiceMessagingService,
    NotificationQueueService,
    NotificationJobSchedulerService,
    NotificationTypeService,
  ],
})
export class NotificationModule {}
