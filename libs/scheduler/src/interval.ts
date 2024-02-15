import {
  addMinutes,
  areIntervalsOverlapping,
  compareAsc,
  differenceInMinutes,
  getMinutes,
  isAfter,
  isBefore,
  isEqual,
  isWithinInterval,
  max,
  min,
  parse,
} from 'date-fns';

export interface DateInterval extends Interval {
  start: Date;
  end: Date;
}

export interface TimeInterval {
  from: string; // HH:mm
  to: string; // HH:mm
}

/**
 * Converts a time interval to a date interval on the given day.
 */
export const timeToDateInterval = (time: TimeInterval, day: Date): DateInterval => {
  return {
    start: parse(time.from, 'HH:mm', day),
    end: parse(time.to, 'HH:mm', day),
  };
};

/**
 * Shortcut method for determining if two intervals are the same based on their range.
 */
export const isSameInterval = (a: DateInterval, b: DateInterval): boolean => isEqual(a.start, b.start) && isEqual(a.end, b.end);

/**
 * Sorts date intervals first by their start date, then by their end date.
 */
export const sortDateIntervals = (intervals: DateInterval[]): DateInterval[] => {
  return [...intervals].sort((i1, i2) => compareAsc(i1.start, i2.start) || compareAsc(i1.end, i2.end));
};

/**
 * Combines multiple adjacent or overlapping date intervals into fewer larger intervals. This helps with performance
 * because we don't have to check as many smaller intervals during availability calculations.
 */
export const combineDateIntervals = (intervals: DateInterval[]): DateInterval[] => {
  return sortDateIntervals(intervals).reduce<DateInterval[]>((acc, cur) => {
    const last = acc.pop();

    if (last) {
      const overlaps = areIntervalsOverlapping(last, cur, { inclusive: true });

      if (overlaps) {
        const combined: DateInterval = {
          start: last.start,
          end: max([last.end, cur.end]),
        };
        return [...acc, combined];
      } else {
        return [...acc, last, cur];
      }
    }

    return [cur];
  }, []);
};

/**
 * Clamps a set of date intervals to a range, and removes any date intervals that aren't in the range all together.
 *
 * Example:
 *  Intervals: 9:00-11:00, 12:00-14:00, 15:00-:17:00
 *  Range: 10:00-13:00
 *
 *  Result:
 *    10:00-11:00, 12:00-13:00
 */
export const clampDateIntervalsToRange = (intervals: DateInterval[], range: DateInterval): DateInterval[] => {
  return intervals.flatMap((interval) => {
    return areIntervalsOverlapping(interval, range)
      ? {
          start: max([interval.start, range.start]),
          end: min([interval.end, range.end]),
        }
      : [];
  });
};

/**
 * Determines the start offset based on the interval start time and the requested offset.
 *
 * Example:
 *  Time: 12:05
 *  Offset: 15 minutes
 *
 *  Result:
 *    12:15
 *
 * @internal
 */
const determineStartingOffset = (date: Date, offset: number): Date => {
  return addMinutes(date, Math.ceil(getMinutes(date) / offset) * offset - getMinutes(date));
};

/**
 * Determines the number of partitions that fit wholly in a given date interval, duration, and offset.
 *
 * Example:
 *  Interval: 12:05-13:00
 *  Duration: 20
 *  Offset: 10
 *
 *  Result:
 *    2 (12:10-12:30, 12:30-12:50)
 *
 * @internal
 */
const determinePartitionsNumber = (interval: DateInterval, duration: number, offset: number): number => {
  const availableTime = differenceInMinutes(interval.end, interval.start);
  return ~~(Math.min(availableTime - duration + offset, availableTime) / offset);
};

/**
 * Partitions a date interval in to several intervals that are wholly within the original date interval.
 */
export const partitionDateInterval = (interval: DateInterval, duration: number, offset: number = duration): DateInterval[] => {
  const startOffset = determineStartingOffset(interval.start, offset);

  const partitions = determinePartitionsNumber(
    {
      start: startOffset,
      end: interval.end,
    },
    duration,
    offset,
  );

  return [...Array(partitions).keys()].map<DateInterval>((idx) => {
    const from = addMinutes(startOffset, idx * offset);
    const to = addMinutes(from, duration);

    return { start: from, end: to };
  });
};

/**
 * Subtracts date interval B from date interval A. This method may return 0 or more date intervals depending
 * on how interval B overlaps with interval A.
 *
 * Example:
 *  A: 12:00-13:00
 *  B: 12:30-13:30
 *
 *  Result:
 *    12:00-12:30
 */
export const subtractDateInterval = (a: DateInterval, b: DateInterval): DateInterval[] => {
  // Case 1: A does not intersect at all with B, return A
  if (!areIntervalsOverlapping(a, b)) {
    return [a];
  }

  // Case 2: A is inclusively contained with B, return nothing
  if (isWithinInterval(a.start, b) && isWithinInterval(a.end, b)) {
    return [];
  }

  // Case 3: B is exclusively contained with A, return a split interval
  if (isBefore(a.start, b.start) && isAfter(a.end, b.end)) {
    return [
      {
        start: a.start,
        end: b.start,
      },
      {
        start: b.end,
        end: a.end,
      },
    ];
  }

  // Case 4: A intersects with B in some regard, return a bound interval
  return [
    {
      start: isBefore(a.start, b.start) ? a.start : b.end,
      end: isAfter(a.end, b.end) ? a.end : b.start,
    },
  ];
};

/**
 * Subtracts date intervals B[] from a single interval A.
 *
 * Example:
 *  A: 09:00-17:00
 *  B[0]: 12:00-13:00
 *  B[1]: 15:30-20:00
 *
 *  Calculated intervals:
 *    [09:00-12:00, 13:00-15:30]
 */
export const subtractDateIntervals = (a: DateInterval, b: DateInterval[]): DateInterval[] => {
  return sortDateIntervals(b).reduce(
    (acc, cur) => {
      return acc.length > 0 ? [...acc.slice(0, -1), ...subtractDateInterval(acc.pop(), cur)] : [];
    },
    [a],
  );
};
