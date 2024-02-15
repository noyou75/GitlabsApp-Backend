import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isLessThanProperty' })
export class IsLessThanPropertyConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): Promise<boolean> | boolean {
    const referredVal = (args.object as any)[args.constraints[0]];

    /* In order for this validation operation to succeed, the values in question must be valid numbers, and the
     * value of the property decorated by this validator must be less than that of the property indicated in the
     * decorator's factory function parameter. */
    return typeof value === 'number' && !Number.isNaN(value) &&
      typeof referredVal === 'number' && !Number.isNaN(value) &&
      (value < referredVal || (args.constraints[1] && value === referredVal));
  }

  defaultMessage(args?: ValidationArguments): string {
    return `$property must be less than ${ args.constraints[0] }`;
  }
}

export interface IsLessThanPropertyConstraintOptions extends ValidationOptions {
  equals?: boolean;
}

export function IsLessThanProperty(property: string, validationOptions?: IsLessThanPropertyConstraintOptions) {
  return (target: any, decoratedProperty: string) => {
    registerDecorator({
      name: 'isLessThan',
      target: target.constructor,
      propertyName: decoratedProperty,
      constraints: [property, validationOptions?.equals || false],
      options: validationOptions,
      validator: IsLessThanPropertyConstraint,
    });
  };
}
