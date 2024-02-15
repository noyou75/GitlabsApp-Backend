import { SetMetadata } from '@nestjs/common';
import { CouponConditionEnum } from '../../../common/enums/coupon-condition.enum';

export const CouponConditionMetadataKey = 'coupon-condition';

export function CouponCondition(rule: CouponConditionEnum) {
  return SetMetadata(CouponConditionMetadataKey, rule);
}
