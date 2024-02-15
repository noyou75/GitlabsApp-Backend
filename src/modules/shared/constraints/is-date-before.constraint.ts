import { ValidationOptions } from 'class-validator';
import { isBefore, isSameDay } from 'date-fns';
import { CompareDate } from './compare-simple-date-time.constraint';

export const IsDateBefore = (property: string, allowSameDay?: boolean, validationOptions?: ValidationOptions) => {
  return CompareDate(property, (date1, date2) => isBefore(date1, date2) || (allowSameDay && isSameDay(date1, date2)),
    'before', validationOptions);
};
