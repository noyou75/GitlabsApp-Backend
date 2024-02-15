import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponEntity } from '../../entities/coupon.entity';
import { NotificationModule } from '../notification/notification.module';
import { IsEligibleCouponConstraint } from './constraints/is-eligible-coupon.constraint';
import { CouponService } from './coupon.service';
import { FirstVisitOnlyCouponCondition } from './condition/first-visit-only.coupon-condition';
import { FirstVisitNotification } from './notifications/first-visit.notification';
import { CouponNotifierService } from './services/coupon-notifier.service';

@Module({
  imports: [TypeOrmModule.forFeature([CouponEntity]), NotificationModule],
  providers: [CouponService, FirstVisitOnlyCouponCondition, CouponNotifierService, FirstVisitNotification, IsEligibleCouponConstraint],
  exports: [CouponService],
})
export class CouponModule {}
