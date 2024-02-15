import { parseISO } from 'date-fns';
import {
  clampDateIntervalsToRange,
  combineDateIntervals,
  DateInterval,
  isSameInterval,
  partitionDateInterval,
  sortDateIntervals,
  subtractDateInterval,
  subtractDateIntervals,
  TimeInterval,
  timeToDateInterval,
} from './interval';

describe('Intervals', () => {
  it('should convert a time interval to a date interval', () => {
    const given: TimeInterval = {
      from: '09:00',
      to: '17:00',
    };

    const date = parseISO('2020-11-22');

    const expected: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    expect(timeToDateInterval(given, date)).toEqual(expected);
  });

  it('should compare date intervals', () => {
    const a: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    const b: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    const c: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    expect(isSameInterval(a, b)).toBe(true);
    expect(isSameInterval(a, c)).toBe(false);
  });

  it('should sort by the start date followed by end date', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-23T09:30:00'),
        end: parseISO('2020-11-23T10:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:45:00'),
        end: parseISO('2020-11-23T10:00:00'),
      },
      {
        start: parseISO('2020-11-24T08:00:00'),
        end: parseISO('2020-11-24T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:15:00'),
        end: parseISO('2020-11-23T10:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:15:00'),
        end: parseISO('2020-11-23T10:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:30:00'),
        end: parseISO('2020-11-23T10:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:45:00'),
        end: parseISO('2020-11-23T10:00:00'),
      },
      {
        start: parseISO('2020-11-24T08:00:00'),
        end: parseISO('2020-11-24T09:00:00'),
      },
    ];

    expect(sortDateIntervals(given)).toEqual(expected);
  });

  it('should combine adjacent date intervals', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    expect(combineDateIntervals(given)).toEqual(expected);
  });

  it('should combine encompassing date intervals that start and end outside of all other intervals', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T07:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T07:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    expect(combineDateIntervals(given)).toEqual(expected);
  });

  it('should combine encompassing date intervals that start exactly at the earliest interval', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
    ];

    expect(combineDateIntervals(given)).toEqual(expected);
  });

  it('should combine encompassing date intervals that end exactly at the latest interval', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:30:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    expect(combineDateIntervals(given)).toEqual(expected);
  });

  it('should ignore date intervals that fall inside another date interval', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:30:00'),
        end: parseISO('2020-11-22T08:45:00'),
      },
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T08:30:00'),
        end: parseISO('2020-11-22T09:30:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
    ];

    expect(combineDateIntervals(given)).toEqual(expected);
  });

  it('should not combine non-adjacent date intervals', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T09:00:00'),
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
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T08:00:00'),
        end: parseISO('2020-11-22T10:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T13:00:00'),
      },
    ];

    expect(combineDateIntervals(given)).toEqual(expected);
  });

  it('should keep all date intervals in a range', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T17:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:00:00'),
        end: parseISO('2020-11-23T17:00:00'),
      },
      {
        start: parseISO('2020-11-24T09:00:00'),
        end: parseISO('2020-11-24T17:00:00'),
      },
    ];

    const range: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-24T20:00:00'),
    };

    expect(clampDateIntervalsToRange(given, range)).toEqual(given);
  });

  it('should clamp date intervals to a range', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T17:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:00:00'),
        end: parseISO('2020-11-23T17:00:00'),
      },
      {
        start: parseISO('2020-11-24T09:00:00'),
        end: parseISO('2020-11-24T17:00:00'),
      },
    ];

    const range: DateInterval = {
      start: parseISO('2020-11-22T12:00:00'),
      end: parseISO('2020-11-24T12:00:00'),
    };

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T12:00:00'),
        end: parseISO('2020-11-22T17:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:00:00'),
        end: parseISO('2020-11-23T17:00:00'),
      },
      {
        start: parseISO('2020-11-24T09:00:00'),
        end: parseISO('2020-11-24T12:00:00'),
      },
    ];

    expect(clampDateIntervalsToRange(given, range)).toEqual(expected);
  });

  it('should remove date intervals outside a range', () => {
    const given: DateInterval[] = [
      {
        start: parseISO('2020-11-22T09:00:00'),
        end: parseISO('2020-11-22T17:00:00'),
      },
      {
        start: parseISO('2020-11-23T09:00:00'),
        end: parseISO('2020-11-23T17:00:00'),
      },
      {
        start: parseISO('2020-11-24T09:00:00'),
        end: parseISO('2020-11-24T17:00:00'),
      },
    ];

    const range: DateInterval = {
      start: parseISO('2020-11-22T20:00:00'),
      end: parseISO('2020-11-24T07:00:00'),
    };

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-23T09:00:00'),
        end: parseISO('2020-11-23T17:00:00'),
      },
    ];

    expect(clampDateIntervalsToRange(given, range)).toEqual(expected);
  });

  it('should partition a date interval in to several date intervals', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T13:00:00'),
    };

    const expected: DateInterval[] = [
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
    ];

    expect(partitionDateInterval(given, 60)).toEqual(expected);
  });

  it('should partition a date interval in to several date intervals with different offsets', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T12:00:00'),
    };

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T10:00:00'),
        end: parseISO('2020-11-22T11:00:00'),
      },
      {
        start: parseISO('2020-11-22T10:30:00'),
        end: parseISO('2020-11-22T11:30:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
    ];

    expect(partitionDateInterval(given, 60, 30)).toEqual(expected);
  });

  it('should partition a date interval in to several date intervals when the start date and offset do not line up', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:10:00'),
      end: parseISO('2020-11-22T12:45:00'),
    };

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-22T10:30:00'),
        end: parseISO('2020-11-22T11:30:00'),
      },
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T11:30:00'),
        end: parseISO('2020-11-22T12:30:00'),
      },
    ];

    expect(partitionDateInterval(given, 60, 30)).toEqual(expected);
  });

  it('should return the original interval if the subtracted interval does not overlap before', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T08:00:00'),
      end: parseISO('2020-11-22T09:00:00'),
    };

    const expected: DateInterval[] = [given];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should return the original interval if the subtracted interval does not overlap after', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T12:00:00'),
      end: parseISO('2020-11-22T13:00:00'),
    };

    const expected: DateInterval[] = [given];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should return the original interval if the subtracted interval does not overlap but is adjacent before', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: given.start,
    };

    const expected: DateInterval[] = [given];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should return the original interval if the subtracted interval does not overlap but is adjacent after', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: given.end,
      end: parseISO('2020-11-22T12:00:00'),
    };

    const expected: DateInterval[] = [given];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should return no interval if the subtracted interval is the same as the interval', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const expected: DateInterval[] = [];

    expect(subtractDateInterval(given, given)).toEqual(expected);
  });

  it('should return no interval if the subtracted interval encompasses the interval', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T12:00:00'),
    };

    const expected: DateInterval[] = [];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should return no interval if the subtracted interval encompasses the interval and continues in the future', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: given.start,
      end: parseISO('2020-11-22T12:00:00'),
    };

    const expected: DateInterval[] = [];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should return no interval if the subtracted interval encompasses the interval and continues in the past', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: given.end,
    };

    const expected: DateInterval[] = [];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should should return a bound interval if the subtracted interval overlaps the beginning', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T10:30:00'),
    };

    const expected: DateInterval[] = [
      {
        start: subtract.end,
        end: given.end,
      },
    ];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should should return a bound interval if the subtracted interval overlaps the beginning exactly', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: given.start,
      end: parseISO('2020-11-22T10:30:00'),
    };

    const expected: DateInterval[] = [
      {
        start: subtract.end,
        end: given.end,
      },
    ];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should should return a bound interval if the subtracted interval overlaps the end', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T10:45:00'),
      end: parseISO('2020-11-22T12:00:00'),
    };

    const expected: DateInterval[] = [
      {
        start: given.start,
        end: subtract.start,
      },
    ];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should should return a bound interval if the subtracted interval overlaps the end exactly', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T11:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T10:45:00'),
      end: given.end,
    };

    const expected: DateInterval[] = [
      {
        start: given.start,
        end: subtract.start,
      },
    ];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should should split the interval if the interval encompasses the subtracted interval', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T10:00:00'),
      end: parseISO('2020-11-22T12:00:00'),
    };

    const subtract: DateInterval = {
      start: parseISO('2020-11-22T10:30:00'),
      end: parseISO('2020-11-22T11:30:00'),
    };

    const expected: DateInterval[] = [
      {
        start: given.start,
        end: subtract.start,
      },
      {
        start: subtract.end,
        end: given.end,
      },
    ];

    expect(subtractDateInterval(given, subtract)).toEqual(expected);
  });

  it('should split the interval encompasses several subtracted intervals', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    const subtract: DateInterval[] = [
      {
        start: parseISO('2020-11-22T11:00:00'),
        end: parseISO('2020-11-22T12:00:00'),
      },
      {
        start: parseISO('2020-11-22T14:00:00'),
        end: parseISO('2020-11-22T15:00:00'),
      },
    ];

    const expected: DateInterval[] = [
      {
        start: given.start,
        end: subtract[0].start,
      },
      {
        start: subtract[0].end,
        end: subtract[1].start,
      },
      {
        start: subtract[1].end,
        end: given.end,
      },
    ];

    expect(subtractDateIntervals(given, subtract)).toEqual(expected);
  });

  it('should return nothing when one or more of the subtracted intervals encompasses the interval', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    const subtract: DateInterval[] = [
      {
        start: parseISO('2020-11-22T00:00:00'),
        end: parseISO('2020-11-22T23:59:59'),
      },
      {
        start: parseISO('2020-11-22T14:00:00'),
        end: parseISO('2020-11-22T15:00:00'),
      },
    ];

    const expected: DateInterval[] = [];

    expect(subtractDateIntervals(given, subtract)).toEqual(expected);
  });

  it('should return nothing when one or more of the unsorted subtracted intervals encompasses the interval', () => {
    const given: DateInterval = {
      start: parseISO('2020-11-22T09:00:00'),
      end: parseISO('2020-11-22T17:00:00'),
    };

    const subtract: DateInterval[] = [
      {
        start: parseISO('2020-11-22T06:00:00'),
        end: parseISO('2020-11-22T20:00:00'),
      },
      {
        start: parseISO('2020-11-22T00:00:00'),
        end: parseISO('2020-11-22T05:00:00'),
      },
    ];

    const expected: DateInterval[] = [];

    expect(subtractDateIntervals(given, subtract)).toEqual(expected);
  });
});
