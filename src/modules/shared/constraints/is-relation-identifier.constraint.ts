import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import isUUID from 'validator/lib/isUUID';

@ValidatorConstraint({ name: 'isRelationIdentifier' })
export class IsRelationIdentifierConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    return typeof value === 'string' && isUUID(value);
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return '$property must be a UUID';
  }
}

export const IsRelationIdentifier = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsRelationIdentifierConstraint,
    });
  };
};
