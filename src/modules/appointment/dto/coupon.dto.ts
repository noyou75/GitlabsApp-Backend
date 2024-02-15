import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { IsEligibleCoupon } from '../../coupon/constraints/is-eligible-coupon.constraint';

@Exclude()
export class CouponDto {
  @IsNotEmpty()
  @Expose()
  paymentIntentId: string;

  @IsNotEmpty()
  @IsEligibleCoupon({ message: 'invalidCouponCode' })
  @Expose()
  coupon: string;
}
