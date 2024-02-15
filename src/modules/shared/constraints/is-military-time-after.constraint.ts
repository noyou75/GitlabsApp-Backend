import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isAfter, parse as parseDate } from 'date-fns';

@ValidatorConstraint({ name: 'isMilitaryTimeAfter' })
export class IsMilitaryTimeAfterConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    return isAfter(parseDate(value, 'HH:mm', new Date()), parseDate(args.object[args.constraints[0]], 'HH:mm', new Date()));
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `$property time must be after "${validationArguments.constraints[0]}" property`;
  }
}

export const IsMilitaryTimeAfter = (property: string, validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsMilitaryTimeAfterConstraint,
    });
  };
};
