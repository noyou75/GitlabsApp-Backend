import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TimezoneService } from '../../core/services/timezone.service';

@Injectable()
@ValidatorConstraint({ name: 'isTimezone', async: true })
export class IsTimezoneConstraint implements ValidatorConstraintInterface {
  constructor(private readonly timezoneService: TimezoneService) {}

  validate(value: any, args?: ValidationArguments): boolean {
    return typeof value === 'string' && this.timezoneService.has(value);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `$property must be one of the following values: ${this.timezoneService.ids().join(', ')}`;
  }
}

export const IsTimezone = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTimezoneConstraint,
    });
  };
};
