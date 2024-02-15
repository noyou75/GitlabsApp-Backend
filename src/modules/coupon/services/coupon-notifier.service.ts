import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { CouponEntity } from '../../../entities/coupon.entity';
import { User } from '../../../entities/user.entity';
import { INotification } from '../../notification/notification';
import { NotificationService } from '../../notification/services/notification.service';
import { CouponNotificationMeta, CouponNotificationMetadataKey } from '../notifications/coupon-notification.decorator';

@Injectable()
export class CouponNotifierService implements OnModuleInit {
  private couponNotifications: { [key: string]: Type<INotification> };

  constructor(private readonly discoveryService: DiscoveryService, private readonly notificationService: NotificationService) {}

  public async onModuleInit() {
    this.couponNotifications = await this.discoveryService
      .providersWithMetaAtKey<CouponNotificationMeta>(CouponNotificationMetadataKey)
      .then(providers => {
        return providers.reduce((collector, provider) => {
          collector[this.getNotificationKey(provider.meta)] = provider.discoveredClass.injectType;
          return collector;
        }, {});
      });
  }

  public async issueNotification(coupon: CouponEntity, recipient: User) {
    /* Attempt to find a notification for the supplied coupon. */
    const notification = this.getNotification(coupon);

    /* If this coupon notification does not exist, throw an exception. */
    if (!notification) {
      throw new Error(`Cannot issue notification for ${coupon.code}; please ensure this coupon code has a notification mapped to it.`);
    }

    /* Otherwise, go ahead and issue the notification. */
    return this.notificationService.send(notification, recipient, { coupon });
  }

  private getNotification(coupon: CouponEntity) {
    /* If an exact match for this coupon's type and code is found, return the corresponding notification.  Otherwise, attempt to return
     * the notification mapping to this coupon's type. */
    return (
      this.couponNotifications[this.getNotificationKey({ couponType: coupon.couponType, code: coupon.code })] ||
      this.couponNotifications[this.getNotificationKey({ couponType: coupon.couponType })]
    );
  }

  private getNotificationKey(notificationMeta: CouponNotificationMeta) {
    return `${notificationMeta.couponType}${notificationMeta.code ? '.' + notificationMeta.code : ''}`;
  }
}
