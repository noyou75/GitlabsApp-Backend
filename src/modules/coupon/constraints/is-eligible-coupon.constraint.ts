import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { PatientUser } from '../../../entities/user.entity';
import { CouponService } from '../coupon.service';

@Injectable()
@ValidatorConstraint({ name: 'isEligibleCoupon', async: true })
export class IsEligibleCouponConstraint implements ValidatorConstraintInterface {
  constructor(private readonly coupons: CouponService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    return this.coupons.isEligible(RequestContext.get<PatientUser>(REQUEST_CONTEXT_USER), value);
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `$property must be a valid coupon code`;
  }
}

export const IsEligibleCoupon = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEligibleCouponConstraint,
    });
  };
};
