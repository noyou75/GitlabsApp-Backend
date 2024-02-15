import { addDays, addMinutes, differenceInMinutes } from 'date-fns';
import { DateInterval, timeToDateInterval } from './interval';
import { schedulesToDateIntervals, scheduleToDateIntervals } from './schedule';
import { aggregateTimeslotAvailability, reduceTimeslotAvailability, removeOverlappingTimeslots, Timeslot } from './timeslot';
import { daysOfTheWeek, Schedule, WeeklyTimetable } from './timetable';
import { isValidDateRange, isValidPositiveNumber, isValidTime } from './validate';

export interface AvailabilityParameters {
  // The start of the date range for generate timeslots.
  start: Date;

  // The end of the date range for generated timeslots.
  end: Date;

  // The duration of the generated timeslots in minutes.
  duration: number;

  // The offset of the generated timeslots in minutes.
  //
  // Defaults to the duration if not provided. Offsets lower than the duration
  // will create overlapping timeslots. Offsets higher than the duration will
  // create timeslots with buffer time between them.
  offset?: number;

  // Schedules to use when generating timeslots.
  //
  // At least one schedule must be provided. Multiple overlapping schedules will
  // create multiple timeslots at those times.
  // schedules: OneOrMoreArray<Partial<Schedule & WeeklyTimetable>>;
  schedules: Partial<Schedule & WeeklyTimetable>[];

  // Blackout times during which no timeslots will be created.
  blackouts?: DateInterval[];

  // A list of already allocated timeslots.
  //
  // These allocations will reduce the number of availabilities at timeslots that
  // overlap with them.
  allocations?: DateInterval[];

  // Business hours to consider for showing unavailable slots.
  businessHours?: WeeklyTimetable;

  // Similar to blackouts, but also affects the business hours
  holidays?: DateInterval[];
}

export const getAvailabilities = async (params: AvailabilityParameters): Promise<Timeslot[]> => {
  validate(params);

  const range: DateInterval = {
    start: params.start,
    end: params.end,
  };

  // Step 1. Calculate available timeslots according to schedules, blackouts, and existing allocations
  const timeslots: Timeslot[] = reduceTimeslotAvailability(
    removeOverlappingTimeslots(
      aggregateTimeslotAvailability(schedulesToDateIntervals(params.schedules, range, params.duration, params.offset)),
      params.blackouts ?? [],
    ),
    params.allocations ?? [],
  );

  // Step 2. Overlay business hours via backfill strategy if business hours are available
  return removeOverlappingTimeslots(
    aggregateTimeslotAvailability(
      [...timeslots, ...schedulesToDateIntervals([params.businessHours ?? {}], range, params.duration, params.offset)],
      {
        backfillOnly: true,
      },
    ),
    params.holidays ?? [],
  );
};

export interface EarliestAvailabilityParams {
  // Minimum notice period in minutes.
  minimumNotice: number;

  // Schedule to follow when calculating earliest availability.
  schedule: Partial<Schedule & WeeklyTimetable>;

  // Date to start searching from. Defaults to now.
  start?: Date;

  // Max date to consider when searching for earliest availability. Defaults to 14 days from the start date.
  end?: Date;
}

export const getEarliestAvailabilityForMinimumNotice = async (params: EarliestAvailabilityParams): Promise<Date | null> => {
  const start = params.start ?? new Date();
  const end = params.end ?? addDays(start, 14);

  validateSchedule(params.schedule);

  if (!isValidPositiveNumber(params.minimumNotice)) {
    throw new Error(`${params.minimumNotice} is not a valid minimum notice amount`);
  }

  if (!isValidDateRange(start, end)) {
    throw new Error(`Date range from ${start} to ${end} is not a valid date range`);
  }

  const intervals = scheduleToDateIntervals(params.schedule, { start, end });

  let minutes = params.minimumNotice;

  for (const interval of intervals) {
    const diff = differenceInMinutes(interval.end, interval.start);
    if (minutes >= diff) {
      minutes -= diff;
    } else {
      return addMinutes(interval.start, minutes);
    }
  }

  return null;
};

/**
 * Validates all passed parameters and returns an Error if necessary.
 */
const validate = (params: AvailabilityParameters): void => {
  if (!isValidDateRange(params.start, params.end)) {
    throw new Error(`Availability range from ${params.start} to ${params.end} is not a valid date range`);
  }

  if (!isValidPositiveNumber(params.duration)) {
    throw new Error(`${params.duration} is not a valid duration`);
  }

  if (params.offset !== undefined && !isValidPositiveNumber(params.offset)) {
    throw new Error(`${params.offset} is not a valid offset`);
  }

  params.schedules.forEach((schedule: Partial<Schedule & WeeklyTimetable>) => {
    validateSchedule(schedule);
  });

  if (params.blackouts !== undefined && params.blackouts.length > 0) {
    params.blackouts.forEach((blackout) => {
      if (!isValidDateRange(blackout.start, blackout.end)) {
        throw new Error(`Blackout range from ${blackout.start} to ${blackout.end} is not a valid date range`);
      }
    });
  }

  if (params.allocations !== undefined && params.allocations.length > 0) {
    params.allocations.forEach((allocation) => {
      if (!isValidDateRange(allocation.start, allocation.end)) {
        throw new Error(`Allocation range from ${allocation.start} to ${allocation.end} is not a valid date range`);
      }
    });
  }

  if (params.businessHours !== undefined) {
    validateTimetable(params.businessHours);
  }
};

const validateSchedule = (schedule: Partial<Schedule & WeeklyTimetable>): void => {
  schedule.availabilities?.forEach((availability) => {
    if (!isValidDateRange(availability.start, availability.end)) {
      throw new Error(`Schedule availability range from ${availability.start} to ${availability.end} is not a valid date range`);
    }
  });
  schedule.blackouts?.forEach((blackout) => {
    if (!isValidDateRange(blackout.start, blackout.end)) {
      throw new Error(`Schedule blackout range from ${blackout.start} to ${blackout.end} is not a valid date range`);
    }
  });
  validateTimetable(schedule);
};

const validateTimetable = (timetable: WeeklyTimetable): void => {
  daysOfTheWeek.forEach((day) => {
    timetable[day]?.forEach((time) => {
      if (!isValidTime(time.from)) {
        throw new Error(`Schedule time ${time.from} for ${day} is not a valid time`);
      }
      if (!isValidTime(time.to)) {
        throw new Error(`Schedule time ${time.to} for ${day} is not a valid time`);
      }

      const range = timeToDateInterval(time, new Date());

      if (!isValidDateRange(range.start, range.end)) {
        throw new Error(`Schedule time range from ${time.from} to ${time.to} for ${day} is not a valid time range`);
      }
    });
  });
};
