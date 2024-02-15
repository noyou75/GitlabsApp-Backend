import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { performance } from 'perf_hooks';
import { inspect } from 'util';
import { getAvailabilities } from '../src';
import { Day, WeeklyTimetable } from '../src/timetable';

const start = performance.now();

const results = getAvailabilities({
  start: startOfDay(parseISO('2020-11-15T00:00:00')),
  end: endOfDay(parseISO('2020-11-21T00:00:00')),

  // Duration of each slot
  duration: 60,

  // The offset of each slot. Defaults to the duration so we don't generate overlapping slots.
  offset: 30,

  // Provide multiple schedules. Schedules that overlap will create multiple availabilities during those times.
  schedules: [
    {
      monday: [
        {
          from: '09:00',
          to: '12:00',
        },
        {
          from: '12:00',
          to: '17:00',
        },
      ],
      tuesday: [
        {
          from: '09:00',
          to: '12:00',
        },
      ],
      // Individual schedule blackouts (vacation, pto, etc)
      blackouts: [
        {
          start: parseISO('2020-11-16T10:00:00'),
          end: parseISO('2020-11-16T13:00:00'),
        },
      ],
    },
    {
      tuesday: [
        {
          from: '09:00',
          to: '12:00',
        },
      ],
    },
  ],

  // Periods of time that are not bookable at all, regardless of the number of slots available
  blackouts: [
    {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-16T10:15:00'),
    },
  ],

  // Time periods that are already allocated
  allocations: [
    {
      start: parseISO('2020-11-17T10:00:00'),
      end: parseISO('2020-11-17T11:00:00'),
    },
  ],

  // Define business hours to show empty slots during these times
  businessHours: (() => {
    const weekdays: Day[] = [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday, Day.Friday];
    return weekdays.reduce<WeeklyTimetable>((acc, cur) => {
      acc[cur] = [{ from: '09:00', to: '17:00' }];
      return acc;
    }, {});
  })(),
});

const end = performance.now();

console.log(inspect(results, { depth: null }));
console.info('Calculation time: %dms', (end - start).toFixed(2));
