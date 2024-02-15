import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'exactLength' })
export class IsExactLengthConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    return typeof value === 'string' && value.length === args.constraints[0];
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return '$property must be exactly $constraint1 characters long';
  }
}

export const IsExactLength = (length: number, validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [length],
      validator: IsExactLengthConstraint,
    });
  };
};
