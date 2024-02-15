import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isBefore, parse as parseDate } from 'date-fns';

@ValidatorConstraint({ name: 'isMilitaryTimeBefore' })
export class IsMilitaryTimeBeforeConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    return isBefore(parseDate(value, 'HH:mm', new Date()), parseDate(args.object[args.constraints[0]], 'HH:mm', new Date()));
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `$property time must be before "${validationArguments.constraints[0]}" property`;
  }
}

export const IsMilitaryTimeBefore = (property: string, validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsMilitaryTimeBeforeConstraint,
    });
  };
};
