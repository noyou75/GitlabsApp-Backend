import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSampleEntity } from '../../entities/appointment-sample.entity';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityModule } from '../availability/availability.module';
import { CouponModule } from '../coupon/coupon.module';
import { EntityModule } from '../entity/entity.module';
import { FileModule } from '../file/file.module';
import { LabOrderDetailsModule } from '../lab-order-details/lab-order-details.module';
import { LocaleModule } from '../locale/locale.module';
import { NotificationModule } from '../notification/notification.module';
import { PatientCreditModule } from '../patient-credit/patient-credit.module';
import { ReportingModule } from '../reporting/reporting.module';
import { SharedModule } from '../shared/shared.module';
import { SlackModule } from '../slack/slack.module';
import { TemplatingModule } from '../templating/templating.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { UserModule } from '../user/user.module';
import { AppointmentBookFlowController } from './appointment-book-flow.controller';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentSubscriber } from './appointment.subscriber';
import { AppointmentVoter } from './appointment.voter';
import { PatientAppointmentAvailability } from './availability/patient-appointment.availability';
import { AppointmentsByMonthCommand } from './command/appointments-by-month.command';
import { RevenueByMonthCommand } from './command/revenue-by-month.command';
import { NewAppointmentNotificationEventHandler } from './lifecycle-events/new-appointment-notification-event.handler';
import { AppointmentRefundedNotification } from './notifications/appointment-refunded.notification';
import { AppointmentReminderNotification } from './notifications/appointment-reminder.notification';
import { LabOrderReminderNotification } from './notifications/lab-order-reminder.notification';
import { PatientIncompleteBookingNotification } from './notifications/patient-incomplete-booking.notification';
import { AppointmentQueueName } from './queue/appointment-queue.config';
import { AppointmentQueue } from './queue/appointment.queue';
import { AppointmentSampleController } from './sample/appointment-sample.controller';
import { AppointmentSampleService } from './sample/appointment-sample.service';
import { AppointmentSampleVoter } from './sample/appointment-sample.voter';
import { AppointmentJobSchedulerService } from './service/appointment-job-scheduler.service';
import { AppointmentJobService } from './service/appointment-job.service';
import { AppointmentQueueService } from './service/appointment-queue.service';
import { FileProcessorModule } from '../file-processor/file-processor.module';
import { AppointmentDeliveryFormSubscriber } from './appointment-delivery-form.subscriber';
import { NewAppointmentSlackNotificationTemplate } from './templates/new-appointment-slack-notification.template';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentEntity, AppointmentSampleEntity]),
    SharedModule,
    forwardRef(() => AuthModule),
    LocaleModule,
    PatientUserModule,
    BullModule.registerQueue({
      name: AppointmentQueueName,
    }),
    FileModule,
    TemplatingModule,
    NotificationModule,
    AnalyticsModule.registerAsync(),
    SlackModule,
    UserModule,
    AvailabilityModule,
    CouponModule,
    LabOrderDetailsModule,
    LocaleModule,
    PatientCreditModule,
    forwardRef(() => FileProcessorModule),
    ReportingModule,
    EntityModule,
  ],
  providers: [
    AppointmentService,
    AppointmentSubscriber,
    AppointmentDeliveryFormSubscriber,
    AppointmentVoter,
    AppointmentSampleService,
    AppointmentSampleVoter,
    AppointmentJobService,
    LabOrderReminderNotification,
    AppointmentJobSchedulerService,
    AppointmentQueueService,
    AppointmentQueue,
    AppointmentReminderNotification,
    PatientAppointmentAvailability,
    AppointmentRefundedNotification,
    PatientIncompleteBookingNotification,
    RevenueByMonthCommand,
    AppointmentsByMonthCommand,
    NewAppointmentSlackNotificationTemplate,
    NewAppointmentNotificationEventHandler,
  ],
  controllers: [AppointmentController, AppointmentSampleController, AppointmentBookFlowController],
  exports: [AppointmentService],
})
export class AppointmentModule {}
