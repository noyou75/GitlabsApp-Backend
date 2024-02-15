import { Exclude, Expose } from 'class-transformer';
import Stripe from 'stripe';
import { CouponEntity } from '../../../entities/coupon.entity';

export enum PaymentAdjustmentType {
  COUPON = 'COUPON',
  CREDITS = 'CREDITS',
  OTHER = 'OTHER',
}

@Exclude()
export class PaymentAdjustmentDto {
  @Expose()
  paymentIntent: Stripe.PaymentIntent;

  @Expose()
  adjustments: PaymentAdjustment<any>[];
}

export interface CouponPaymentAdjustmentData {
  coupon: CouponEntity;
}

export interface PaymentAdjustment<T> {
  amount: number;
  type: PaymentAdjustmentType;
  data?: T;
}
