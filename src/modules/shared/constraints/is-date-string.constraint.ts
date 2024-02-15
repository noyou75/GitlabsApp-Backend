import { isISO8601, registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, ValidatorOptions } from 'class-validator';
import { format, isMatch } from 'date-fns';

@ValidatorConstraint({ name: 'isDateString' })
export class IsDateStringConstraint implements ValidatorConstraintInterface {
  validate(value: string, validationArguments?: ValidationArguments): boolean {
    /* Validate the inbound value against the format supplied with the constraint parameters.  If no dateFormat is set, we default
     * to using ISO-8601 as our validating format. */
    return validationArguments[0] ? isMatch(value, validationArguments[0]) : isISO8601(value);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `$property must match the date string format of ${ validationArguments[0] }`;
  }
}

export const IsDateString = (dateFormat?: string, options?: ValidatorOptions) => {
  /* Ensure that the inbound value format is valid */
  try {
    dateFormat && format(new Date(), dateFormat);
  } catch(err) {
    throw new Error(`Invalid string date format - the date format must correspond to the date-fns date token specification.`);
  }

  return (obj: object, propertyName: string) => {
    registerDecorator({
      target: obj.constructor,
      propertyName,
      options: options,
      constraints: [dateFormat],
      validator: IsDateStringConstraint
    })
  }
};
