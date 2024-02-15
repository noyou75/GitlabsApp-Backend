import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { isAfter, isBefore } from 'date-fns';
import { every } from 'p-iteration';
import { FindConditions, IsNull, LessThan, MoreThan } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { CouponConditionEnum } from '../../common/enums/coupon-condition.enum';
import { CouponType } from '../../common/enums/coupon.enum';
import { DiscountType } from '../../common/enums/discount-type.enum';
import { CouponEntity } from '../../entities/coupon.entity';
import { PatientUser } from '../../entities/user.entity';
import { CrudService } from '../api/crud/crud.service';
import { CouponConditionMetadataKey } from './condition/coupon-condition.decorator';
import { CouponConditionInterface } from './condition/coupon-condition.interface';
import { CouponNotifierService } from './services/coupon-notifier.service';

@Injectable()
export class CouponService extends CrudService(CouponEntity) implements OnModuleInit {
  @Inject()
  private readonly discovery: DiscoveryService;

  @Inject()
  private readonly couponNotifier: CouponNotifierService;

  private conditions: { [key: string]: CouponConditionInterface } = {};

  async onModuleInit() {
    this.conditions = await this.discovery.providersWithMetaAtKey(CouponConditionMetadataKey).then(defs => {
      return defs.reduce((collector, def) => {
        collector[def.meta as string] = def.discoveredClass.instance;
        return collector;
      }, {});
    });
  }

  async getCoupon(coupon: string | CouponEntity): Promise<CouponEntity> {
    if (coupon instanceof CouponEntity) {
      return coupon;
    }

    return await this.getRepository().findOneOrFail({ where: { code: coupon.toUpperCase() } });
  }

  async isValid(coupon: string | CouponEntity): Promise<boolean> {
    // 1. Validate coupon code is actually in the system
    try {
      coupon = await this.getCoupon(coupon);
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return false;
      }
      throw e;
    }

    // 2. Validate that it is active
    if (!coupon.isActive) {
      return false;
    }

    // 3. Validate start and end dates
    return !(isBefore(new Date(), coupon.validFrom) || isAfter(new Date(), coupon.validTo));
  }

  async isEligible(user: PatientUser, coupon: string | CouponEntity): Promise<boolean> {
    // Ensure each coupon rule is met
    return (
      (await this.isValid(coupon)) &&
      (await every((await this.getCoupon(coupon)).conditions, async rule => await this.getCondition(rule).isEligible(user)))
    );
  }

  async getDiscountedPrice(originalPrice: number, coupon: string | CouponEntity): Promise<number> {
    try {
      coupon = await this.getCoupon(coupon);
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return originalPrice;
      }
      throw e;
    }

    let price: number;

    switch (coupon.discountType) {
      case DiscountType.Absolute:
        price = Math.max(0, originalPrice - coupon.discount);
        break;
      case DiscountType.Percentage:
        price = Math.max(0, originalPrice - originalPrice * (coupon.discount / 100));
        break;
      default:
        price = originalPrice;
    }

    // Minimum price for a Stripe transaction is $0.50 USD. Amounts lower than this will fail.
    return price >= 50 ? price : 0;
  }

  public async issueCoupon(coupon: string | CouponEntity, user: PatientUser) {
    /* Retrieve the coupon corresponding to the supplied string (if set as a string...) */
    const _coupon = coupon instanceof CouponEntity ? coupon : await this.getCoupon(coupon);

    /* Issue the corresponding notification. */

    /* Issue a coupon code to the supplied user. */
    return this.couponNotifier.issueNotification(_coupon, user);
  }

  public async getEligibleCoupons(user: PatientUser, couponType: CouponType) {
    const now = new Date();

    /* Find all currently-active coupons that are part of the supplied coupon type. */
    return this.find(opts => {
      const common: FindConditions<CouponEntity> = {
        couponType,
        isActive: true,
      };

      opts.where = [
        {
          validFrom: LessThan(now),
          validTo: MoreThan(now),
          ...common,
        },
        {
          validFrom: IsNull(),
          validTo: IsNull(),
          ...common,
        },
        {
          validFrom: IsNull(),
          validTo: MoreThan(now),
          ...common,
        },
        {
          validFrom: LessThan(now),
          validTo: IsNull(),
          ...common,
        },
      ];
    })
      .then(activeCoupons => {
        /* Determine which coupons are applicable to the user. */
        return Promise.all(
          activeCoupons.data.map(activeCoupon => {
            return this.isEligible(user, activeCoupon).then(isEligible => {
              return isEligible ? activeCoupon : null;
            });
          }),
        );
      })
      .then(eligibleCoupons => {
        /* Filter out all coupons identified as not applicable... */
        return eligibleCoupons.reduce((collector, eligibleCoupon) => {
          eligibleCoupon && collector.push(eligibleCoupon);
          return collector;
        }, []);
      });
  }

  // ---

  private getCondition(condition: CouponConditionEnum): CouponConditionInterface {
    if (condition in this.conditions) {
      return this.conditions[condition];
    }

    throw new Error(`CouponCondition "${condition}" does not exist!`);
  }
}
