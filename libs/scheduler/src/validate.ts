import { isBefore, parse } from 'date-fns';

export const isValidDateRange = (from: Date, to: Date): boolean => {
  return isBefore(from, to);
};

export const isValidTime = (time: string): boolean => {
  return !isNaN(parse(time, 'HH:mm', new Date()).getTime());
};

export const isValidPositiveNumber = (number: number): boolean => {
  return Number.isInteger(number) && number > 0;
};
