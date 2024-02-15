import { parseISO } from 'date-fns';
import { isValidPositiveNumber, isValidDateRange, isValidTime } from './validate';

describe('Validation', () => {
  it('should return false for a bad date range', () => {
    expect(isValidDateRange(parseISO('2020-11-23T13:00:00'), parseISO('2020-11-23T13:00:00'))).toBe(false);
    expect(isValidDateRange(parseISO('2020-11-23T14:00:00'), parseISO('2020-11-23T12:00:00'))).toBe(false);
  });

  it('should return true for a good date range', () => {
    expect(isValidDateRange(parseISO('2020-11-23T12:00:00'), parseISO('2020-11-23T12:00:01'))).toBe(true);
    expect(isValidDateRange(parseISO('2020-11-23T12:00:00'), parseISO('2020-11-23T14:00:00'))).toBe(true);
  });

  it('should return false for a bad time', () => {
    expect(isValidTime('12:99')).toBe(false);
    expect(isValidTime('34:20')).toBe(false);
    expect(isValidTime('34:99')).toBe(false);
  });

  it('should return true for a good time', () => {
    expect(isValidTime('12:59')).toBe(true);
    expect(isValidTime('12:20')).toBe(true);
    expect(isValidTime('00:15')).toBe(true);
  });

  it('should return false for a non-positive integer', () => {
    expect(isValidPositiveNumber(0)).toBe(false);
    expect(isValidPositiveNumber(-5)).toBe(false);
  });

  it('should return true for a positive integer', () => {
    expect(isValidPositiveNumber(1)).toBe(true);
    expect(isValidPositiveNumber(5)).toBe(true);
  });
});
