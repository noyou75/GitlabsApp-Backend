import { SetMetadata } from '@nestjs/common';
import { CouponType } from '../../../common/enums/coupon.enum';
import { CouponEntity } from '../../../entities/coupon.entity';
import { AbstractNotification, NotificationParameters, NotificationTypes, SMSNotification } from '../../notification/notification';

export interface CouponNotificationMeta {
  couponType: CouponType;
  code?: string;
}

export const CouponNotificationMetadataKey = 'CouponNotification';

export const CouponNotification = (couponType: CouponType, code?: string) => {
  return SetMetadata<string, CouponNotificationMeta>(CouponNotificationMetadataKey, { couponType, code });
};

export interface CouponNotificationParameters extends NotificationParameters {
  coupon: CouponEntity;
}

export class AbstractCouponNotification extends AbstractNotification {
  constructor(notificationName: string) {
    super(notificationName, [NotificationTypes.SMS]);
  }

  getEmailParams() {
    return undefined;
  }

  async renderSMS(params: CouponNotificationParameters): Promise<SMSNotification | undefined> {
    return super.renderSMS(params);
  }
}
