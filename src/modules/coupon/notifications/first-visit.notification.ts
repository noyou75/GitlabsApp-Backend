import { CouponType } from '../../../common/enums/coupon.enum';
import { Notification } from '../../notification/decorator/notification.decorator';
import { AbstractCouponNotification, CouponNotification } from './coupon-notification.decorator';

@CouponNotification(CouponType.OptIn)
@Notification()
export class FirstVisitNotification extends AbstractCouponNotification {
  constructor() {
    super('first-visit-coupon');
  }
}
