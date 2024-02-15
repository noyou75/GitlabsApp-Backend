import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import isBase64 from 'validator/lib/isBase64';

@ValidatorConstraint({ name: 'base64ByteLength' })
export class IsBase64ByteLengthConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    try {
      const buffer = typeof value === 'string' && isBase64(value) && Buffer.from(value, 'base64');

      return (
        buffer &&
        buffer.byteLength >= (args.constraints[0] || 0) &&
        (args.constraints.length < 2 || typeof args.constraints[1] !== 'number' || buffer.byteLength <= args.constraints[1])
      );
    } catch (err) {
      throw new Error(`Cannot validate the inbound file - the supplied file is not of the expected base64 encoding.  Exception: ${err}`);
    }
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return '$property\'s byte length must fall into ($constraint1, $constraint2) range';
  }
}

export const IsBase64ByteLength = (min: number, max?: number, validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: IsBase64ByteLengthConstraint,
    });
  };
};
