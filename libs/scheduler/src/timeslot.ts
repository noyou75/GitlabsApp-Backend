import { areIntervalsOverlapping } from 'date-fns';
import { DateInterval, isSameInterval, sortDateIntervals } from './interval';

export interface Timeslot extends DateInterval {
  // Tracks the number of available timeslots at this date interval
  available: number;
}

/**
 * Aggregates date intervals in to singular timeslots that contain a count of availabilities at that time.
 *
 * Optional Options:
 *  - backfillOnly: Will not increment availability on any slots, and add any new slots with no availability. This is useful
 *      for adding timeslots in places where there is no availability, but is within business hours and you want to show the
 *      timeslot as unavailable (rather than not showing it at all).
 */
export const aggregateTimeslotAvailability = (intervals: (DateInterval | Timeslot)[], options?: { backfillOnly?: boolean }): Timeslot[] => {
  return sortDateIntervals(intervals).reduce<Timeslot[]>((acc, cur) => {
    const timeslot = acc.find((int2) => isSameInterval(int2, cur));

    if (options?.backfillOnly) {
      return timeslot ? acc : [...acc, { ...cur, available: (cur as Timeslot).available ?? 0 }];
    } else {
      if (timeslot) {
        timeslot.available++;
        return acc;
      } else {
        return [...acc, { ...cur, available: 1 }];
      }
    }
  }, []);
};

/**
 * Reduces availability count for timeslots that overlap with the given date intervals. This is useful for reducing availability count
 * when considering things like already allocated timeslots.
 */
export const reduceTimeslotAvailability = (timeslots: Timeslot[], intervals: DateInterval[]): Timeslot[] => {
  return timeslots
    .map((timeslot) => ({
      ...timeslot,
      available: Math.max(0, timeslot.available - intervals.filter((allocation) => areIntervalsOverlapping(timeslot, allocation)).length),
    }))
    .filter((timeslot) => timeslot.available > 0);
};

/**
 * Removes timeslots that have overlapping date intervals. This is useful when considering blackout periods that should not have
 * any timeslots available.
 */
export const removeOverlappingTimeslots = (timeslots: Timeslot[], intervals: DateInterval[]): Timeslot[] => {
  return timeslots.reduce<Timeslot[]>((acc, cur) => {
    if (intervals.some((interval) => areIntervalsOverlapping(cur, interval))) {
      return acc;
    }

    return [...acc, cur];
  }, []);
};
