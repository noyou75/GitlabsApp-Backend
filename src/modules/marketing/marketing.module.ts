import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { AuthModule } from '../auth/auth.module';
import { CouponModule } from '../coupon/coupon.module';
import { NotificationModule } from '../notification/notification.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { PatientBlastNotificationCommand } from './command/patient-blast-notification.command';
import { CouponCodesHandler } from './handlers/coupon-codes.handler';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';

@Module({
  imports: [AuthModule, AppointmentModule, CouponModule, AnalyticsModule, NotificationModule, PatientUserModule],
  providers: [MarketingService, CouponCodesHandler, PatientBlastNotificationCommand],
  controllers: [MarketingController],
})
export class MarketingModule {}
