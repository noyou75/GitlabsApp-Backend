import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EntityManager } from 'typeorm';
import { LoggerService } from '../../core/services/logger.service';
import { StripeService } from '../../core/services/stripe.service';

type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_action'
  | 'processing'
  | 'requires_authorization'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

@Injectable()
@ValidatorConstraint({ name: 'isPaymentIntentStatus', async: true })
export class IsPaymentIntentStatusConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly stripe: StripeService,
    private readonly logger: LoggerService,
  ) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    // This validator logs only for now, eventually it should return false for certain payment intent status values

    try {
      const paymentIntent = await this.stripe.retrievePaymentIntent(value);

      if (!args.constraints[0].includes(paymentIntent.status)) {
        this.logger.warn(
          `PaymentIntent status invalid! Expected one of [${args.constraints[0].join(', ')}], got ${
            paymentIntent.status
          }. PaymentIntent ID => ${paymentIntent.id}`,
        );
      }
    } catch (e) {
      this.logger.error(e, e.stack);
    }

    return true;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `$property must be a one of: ${validationArguments.constraints[0].join(', ')}`;
  }
}

export const IsPaymentIntentStatus = (statuses: PaymentIntentStatus[], validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [statuses],
      validator: IsPaymentIntentStatusConstraint,
    });
  };
};
