import { combineDateIntervals, DateInterval, partitionDateInterval, subtractDateIntervals } from './interval';
import { Schedule, timetableToSchedule, WeeklyTimetable } from './timetable';

export const scheduleToDateIntervals = (timetable: Partial<Schedule & WeeklyTimetable>, range: DateInterval): DateInterval[] => {
  const schedule = timetableToSchedule(timetable, range);
  const blackouts = combineDateIntervals(schedule.blackouts);
  return schedule.availabilities.flatMap((interval) => subtractDateIntervals(interval, blackouts));
};

export const schedulesToDateIntervals = (
  schedules: Partial<Schedule & WeeklyTimetable>[],
  range: DateInterval,
  duration: number,
  offset?: number,
): DateInterval[] => {
  return schedules
    .map((schedule) => scheduleToDateIntervals(schedule, range))
    .flatMap((intervals) => intervals.flatMap((interval) => partitionDateInterval(interval, duration, offset)));
};
