import { parseISO } from 'date-fns';
import { performance } from 'perf_hooks';
import { getEarliestAvailabilityForMinimumNotice } from '../src';
import { Day, Schedule, WeeklyTimetable } from '../src/timetable';

const start = performance.now();

const result = getEarliestAvailabilityForMinimumNotice({
  minimumNotice: 12 * 60, // 12 hours in minutes
  start: parseISO('2020-11-15T00:00:00'),
  schedule: (() => {
    const weekdays: Day[] = [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday, Day.Friday];
    const schedule: Partial<Schedule & WeeklyTimetable> = {
      blackouts: [
        {
          start: parseISO('2020-11-16T12:00:00'),
          end: parseISO('2020-11-16T13:00:00'),
        },
      ],
    };
    return weekdays.reduce<WeeklyTimetable>((acc, cur) => {
      acc[cur] = [{ from: '09:00', to: '17:00' }];
      return acc;
    }, schedule);
  })(),
});

const end = performance.now();

console.log(result);
console.info('Calculation time: %dms', (end - start).toFixed(4));
