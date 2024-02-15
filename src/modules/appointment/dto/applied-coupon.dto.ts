import { Exclude, Expose } from 'class-transformer';
import Stripe from 'stripe';
import { CouponEntity } from '../../../entities/coupon.entity';

@Exclude()
export class AppliedCouponDto {
  constructor(paymentIntent: Stripe.PaymentIntent, coupon: CouponEntity) {
    this.paymentIntent = paymentIntent;
    this.coupon = coupon;
  }

  @Expose()
  paymentIntent: Stripe.PaymentIntent;

  @Expose()
  coupon: CouponEntity;
}
