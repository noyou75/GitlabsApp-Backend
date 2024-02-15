import { parseISO } from 'date-fns';
import { DateInterval } from './interval';
import { aggregateTimeslotAvailability, reduceTimeslotAvailability, removeOverlappingTimeslots, Timeslot } from './timeslot';

describe('Timeslots', () => {
  it('should aggregate date intervals and keep a count of availabilities at each timeslot', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 3,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 2,
      },
    ];

    expect(aggregateTimeslotAvailability(given)).toEqual(expected);
  });

  it('should not aggregate date intervals that overlap but are not the same', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:30:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T09:30:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
    ];

    expect(aggregateTimeslotAvailability(given)).toEqual(expected);
  });

  it('should backfill timeslots as timeslots with no availability', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 1,
      },
    ];

    const deadlots: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
      },
      {
        start: parseISO('2020-11-22T13:00:00'),
        end: parseISO('2020-11-22T14:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-22T13:00:00'),
        end: parseISO('2020-11-22T14:00:00'),
        available: 0,
      },
    ];

    expect(aggregateTimeslotAvailability([...given, ...deadlots], { backfillOnly: true })).toEqual(expected);
  });

  it('should reduce the available timeslots when applying allocations', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 2,
      },
    ];

    const allocations: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
    ];

    expect(reduceTimeslotAvailability(given, allocations)).toEqual(expected);
  });

  it('should remove timeslots when available allocations drops to zero', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 2,
      },
    ];

    const allocations: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    const expected: Timeslot[] = [];

    expect(reduceTimeslotAvailability(given, allocations)).toEqual(expected);
  });

  it('should reduce the available timeslots when applying allocations to span multiple timeslots', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 2,
      },
    ];

    const allocations: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 1,
      },
    ];

    expect(reduceTimeslotAvailability(given, allocations)).toEqual(expected);
  });

  it('should reduce the available timeslots when applying allocations that have varying durations', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 3,
      },
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
        available: 4,
      },
    ];

    const allocations: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:30:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T13:00:00'),
        end: parseISO('2020-11-22T14:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
        available: 4,
      },
    ];

    expect(reduceTimeslotAvailability(given, allocations)).toEqual(expected);
  });

  it('should reduce the available timeslots when when allocations are adjacent', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 2,
      },
    ];

    const allocations: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 2,
      },
    ];

    expect(reduceTimeslotAvailability(given, allocations)).toEqual(expected);
  });

  it('should remove timeslots that intersect with date intervals exactly', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 2,
      },
    ];

    const intersection: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    const expected: Timeslot[] = [];

    expect(removeOverlappingTimeslots(given, intersection)).toEqual(expected);
  });

  it('should remove timeslots that intersect with date intervals partially', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 2,
      },
    ];

    const intersection: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:45:00'),
        end: parseISO('2020-11-22T10:15:00'),
      },
    ];

    const expected: Timeslot[] = [];

    expect(removeOverlappingTimeslots(given, intersection)).toEqual(expected);
  });

  it('should not remove timeslots that are adjacent to the date intervals', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 2,
      },
    ];

    const intersection: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 2,
      },
    ];

    expect(removeOverlappingTimeslots(given, intersection)).toEqual(expected);
  });

  it('should remove timeslots that intersect with date intervals (complex)', () => {
    const given: Timeslot[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
        available: 1,
      },
    ];

    const intersection: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:15:00'),
      },
      {
        start: parseISO('2020-11-22T11:15:00'),
        end: parseISO('2020-11-22T11:45:00'),
      },
      {
        start: parseISO('2020-11-22T13:00:00'),
        end: parseISO('2020-11-22T14:00:00'),
      },
    ];

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
        available: 1,
      },
    ];

    expect(removeOverlappingTimeslots(given, intersection)).toEqual(expected);
  });
});
