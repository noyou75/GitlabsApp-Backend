import { CouponType } from '../../../common/enums/coupon.enum';
import { PatientUser } from '../../../entities/user.entity';
import { CouponService } from '../../coupon/coupon.service';
import { OptIn, OptInFailureReasons, OptInHandler } from '../decorators/opt-in.decorator';
import { OptInType } from '../dto/opt-in.dto';

@OptIn(OptInType.CouponCodes)
export class CouponCodesHandler implements OptInHandler {
  constructor(private readonly couponService: CouponService) {}

  async optIn(user: PatientUser) {
    let result;
    /* Determine if this user already has booked an appointment with Getlabs.  If so, they are not eligible to receive coupons. */
    try {
      /* Find all opt-in coupons that are currently active. */
      const coupon = await this.couponService
        .getEligibleCoupons(user, CouponType.OptIn)
        .then(coupons => (coupons.length ? coupons[0] : null));

      result = coupon && (await this.couponService.issueCoupon(coupon, user));
    } catch (err) {
      /* User is not eligible to receive a coupon code.
       * Deliberately empty... (for now at least...) */
    }

    return {
      optIn: !!result,
      reasons: !result ? [OptInFailureReasons.IS_ALREADY_OPTED_IN] : [],
    };
  }
}
