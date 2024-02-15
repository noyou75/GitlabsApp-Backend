import { ValidationOptions } from 'class-validator';
import { isAfter, isSameDay } from 'date-fns';
import { CompareDate } from './compare-simple-date-time.constraint';

export const IsDateAfter = (property: string, allowSameDay?: boolean, validationOptions?: ValidationOptions) => {
  return CompareDate(property, (date1, date2) => isAfter(date1, date2) || (allowSameDay && isSameDay(date1, date2)),
    'after', validationOptions);
};
