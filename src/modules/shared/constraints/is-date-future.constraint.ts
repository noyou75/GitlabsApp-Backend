import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isFuture } from 'date-fns';
import { SimpleDateTime } from '../../../entities/embed/simple-date-time.embed';

@ValidatorConstraint({ name: 'isDateFuture' })
export class IsDateFutureConstraint implements ValidatorConstraintInterface {
  validate(value: Date | SimpleDateTime, args: ValidationArguments): boolean {
    return isFuture(value instanceof SimpleDateTime ? value.toDate() : value);
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `$property date must be in the future`;
  }
}

export const IsDateFuture = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateFutureConstraint,
    });
  };
};
