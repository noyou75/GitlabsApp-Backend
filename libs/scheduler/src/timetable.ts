import { eachDayOfInterval, getDay } from 'date-fns';
import { clampDateIntervalsToRange, combineDateIntervals, DateInterval, TimeInterval, timeToDateInterval } from './interval';

export enum Day {
  Sunday = 'sunday',
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
}

// Map days of the week (0-6) to numbers with 0 being Sunday
export const daysOfTheWeek: [Day, Day, Day, Day, Day, Day, Day] = [
  Day.Sunday,
  Day.Monday,
  Day.Tuesday,
  Day.Wednesday,
  Day.Thursday,
  Day.Friday,
  Day.Saturday,
];

export type WeeklyTimetable = {
  [day in Day]?: TimeInterval[];
};

export interface Schedule {
  availabilities: DateInterval[];
  blackouts: DateInterval[];
}

export const timetableToSchedule = (timetable: WeeklyTimetable & Partial<Schedule>, range: DateInterval): Schedule => {
  const intervals = eachDayOfInterval({ start: range.start, end: range.end }).flatMap(
    (day) => getTimetableForDay(day, timetable)?.map((time) => timeToDateInterval(time, day)) ?? [],
  );

  return {
    availabilities: clampDateIntervalsToRange(combineDateIntervals([...(timetable.availabilities ?? []), ...intervals]), range),
    blackouts: clampDateIntervalsToRange(timetable.blackouts ?? [], range),
  };
};

export const getTimetableForDay = (day: Date, timetable: WeeklyTimetable): TimeInterval[] | undefined => {
  return timetable[daysOfTheWeek[getDay(day)]];
};
