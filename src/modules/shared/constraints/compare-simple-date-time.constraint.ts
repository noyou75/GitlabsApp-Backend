import { registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, ValidatorOptions } from 'class-validator';
import { SimpleDateTime } from '../../../entities/embed/simple-date-time.embed';

export type DateComparator = (v1: Date, v2: Date) => boolean;

@ValidatorConstraint({ name: 'compareSimpleDateTime' })
export class CompareSimpleDateTimeConstraint implements ValidatorConstraintInterface {
  validate(value: Date | SimpleDateTime, validationArguments?: ValidationArguments): boolean {
    const otherValue = validationArguments.object[validationArguments[0]];

    /* Validator implicitly passes if one of the two comparators isn't defined */
    if (!value || !otherValue) {
      return true;
    }

    /* Type gate otherValue */
    if (!(otherValue instanceof Date || otherValue instanceof SimpleDateTime)) {
      throw new Error(`Cannot perform date validation - the compared date is defined, but not an instance of Date or SimpleDateTime`);
    }

    /* Normalize the inbound and comparator values to a Date objects, and run the according comparator */
    const comparator: DateComparator = validationArguments[1];
    return comparator(this._normalizeDate(value), this._normalizeDate(otherValue));
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `$property must be ${ validationArguments[2] } ${ validationArguments[0] }`;
  }

  private _normalizeDate(date: Date | SimpleDateTime) {
    return date instanceof SimpleDateTime ? date.toDate() : date;
  }
}

export const CompareDate = (
  comparedPropertyName: string,
  comparator: DateComparator,
  descriptor: string = 'in accordance with',
  options?: ValidatorOptions
) => {
  return (obj: object, propertyName: string) => {
    registerDecorator({
      target: obj.constructor,
      propertyName,
      options: options,
      constraints: [comparedPropertyName, comparator, descriptor],
      validator: CompareSimpleDateTimeConstraint
    })
  }
};
