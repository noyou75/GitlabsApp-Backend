import { parseISO } from 'date-fns';
import { DateInterval } from './interval';
import { schedulesToDateIntervals } from './schedule';
import { Schedule, WeeklyTimetable } from './timetable';

describe('Schedules', () => {
  it('should convert a simple single day schedule to date intervals', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
      },
      {
        start: parseISO('2020-11-16T15:00:00'),
        end: parseISO('2020-11-16T16:00:00'),
      },
      {
        start: parseISO('2020-11-16T16:00:00'),
        end: parseISO('2020-11-16T17:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration)).toEqual(expected);
  });

  it('should convert a complex single day schedule to date intervals', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '12:00',
          },
          {
            from: '13:00',
            to: '17:00',
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
      },
      {
        start: parseISO('2020-11-16T15:00:00'),
        end: parseISO('2020-11-16T16:00:00'),
      },
      {
        start: parseISO('2020-11-16T16:00:00'),
        end: parseISO('2020-11-16T17:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration)).toEqual(expected);
  });

  it('should convert a simple multi day schedule to date intervals', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
        tuesday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
      },
      {
        start: parseISO('2020-11-16T15:00:00'),
        end: parseISO('2020-11-16T16:00:00'),
      },
      {
        start: parseISO('2020-11-16T16:00:00'),
        end: parseISO('2020-11-16T17:00:00'),
      },

      {
        start: parseISO('2020-11-17T09:00:00'),
        end: parseISO('2020-11-17T10:00:00'),
      },
      {
        start: parseISO('2020-11-17T10:00:00'),
        end: parseISO('2020-11-17T11:00:00'),
      },
      {
        start: parseISO('2020-11-17T11:00:00'),
        end: parseISO('2020-11-17T12:00:00'),
      },
      {
        start: parseISO('2020-11-17T12:00:00'),
        end: parseISO('2020-11-17T13:00:00'),
      },
      {
        start: parseISO('2020-11-17T13:00:00'),
        end: parseISO('2020-11-17T14:00:00'),
      },
      {
        start: parseISO('2020-11-17T14:00:00'),
        end: parseISO('2020-11-17T15:00:00'),
      },
      {
        start: parseISO('2020-11-17T15:00:00'),
        end: parseISO('2020-11-17T16:00:00'),
      },
      {
        start: parseISO('2020-11-17T16:00:00'),
        end: parseISO('2020-11-17T17:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration)).toEqual(expected);
  });

  it('should convert a complex multi day schedule to date intervals', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '12:00',
          },
          {
            from: '13:00',
            to: '17:00',
          },
        ],
        tuesday: [
          {
            from: '09:00',
            to: '12:00',
          },
          {
            from: '13:00',
            to: '17:00',
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
      },
      {
        start: parseISO('2020-11-16T15:00:00'),
        end: parseISO('2020-11-16T16:00:00'),
      },
      {
        start: parseISO('2020-11-16T16:00:00'),
        end: parseISO('2020-11-16T17:00:00'),
      },

      {
        start: parseISO('2020-11-17T09:00:00'),
        end: parseISO('2020-11-17T10:00:00'),
      },
      {
        start: parseISO('2020-11-17T10:00:00'),
        end: parseISO('2020-11-17T11:00:00'),
      },
      {
        start: parseISO('2020-11-17T11:00:00'),
        end: parseISO('2020-11-17T12:00:00'),
      },
      {
        start: parseISO('2020-11-17T13:00:00'),
        end: parseISO('2020-11-17T14:00:00'),
      },
      {
        start: parseISO('2020-11-17T14:00:00'),
        end: parseISO('2020-11-17T15:00:00'),
      },
      {
        start: parseISO('2020-11-17T15:00:00'),
        end: parseISO('2020-11-17T16:00:00'),
      },
      {
        start: parseISO('2020-11-17T16:00:00'),
        end: parseISO('2020-11-17T17:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration)).toEqual(expected);
  });

  it('should convert a simple single day schedule to date intervals with different offsets', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;
    const offset = 20;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '12:00',
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T09:20:00'),
        end: parseISO('2020-11-16T10:20:00'),
      },
      {
        start: parseISO('2020-11-16T09:40:00'),
        end: parseISO('2020-11-16T10:40:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:20:00'),
        end: parseISO('2020-11-16T11:20:00'),
      },
      {
        start: parseISO('2020-11-16T10:40:00'),
        end: parseISO('2020-11-16T11:40:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration, offset)).toEqual(expected);
  });

  it('should exclude blackout periods from the date intervals', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
        tuesday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
        blackouts: [
          {
            start: parseISO('2020-11-16T13:00:00'),
            end: parseISO('2020-11-17T13:00:00'),
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
      },

      {
        start: parseISO('2020-11-17T13:00:00'),
        end: parseISO('2020-11-17T14:00:00'),
      },
      {
        start: parseISO('2020-11-17T14:00:00'),
        end: parseISO('2020-11-17T15:00:00'),
      },
      {
        start: parseISO('2020-11-17T15:00:00'),
        end: parseISO('2020-11-17T16:00:00'),
      },
      {
        start: parseISO('2020-11-17T16:00:00'),
        end: parseISO('2020-11-17T17:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration)).toEqual(expected);
  });

  it('should exclude date intervals for times in the schedule that are not in the range', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-18T13:00:00'),
    };
    const duration = 60;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '12:00',
          },
        ],
        tuesday: [
          {
            from: '09:00',
            to: '12:00',
          },
        ],
        wednesday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },

      {
        start: parseISO('2020-11-17T09:00:00'),
        end: parseISO('2020-11-17T10:00:00'),
      },
      {
        start: parseISO('2020-11-17T10:00:00'),
        end: parseISO('2020-11-17T11:00:00'),
      },
      {
        start: parseISO('2020-11-17T11:00:00'),
        end: parseISO('2020-11-17T12:00:00'),
      },

      {
        start: parseISO('2020-11-18T09:00:00'),
        end: parseISO('2020-11-18T10:00:00'),
      },
      {
        start: parseISO('2020-11-18T10:00:00'),
        end: parseISO('2020-11-18T11:00:00'),
      },
      {
        start: parseISO('2020-11-18T11:00:00'),
        end: parseISO('2020-11-18T12:00:00'),
      },
      {
        start: parseISO('2020-11-18T12:00:00'),
        end: parseISO('2020-11-18T13:00:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration)).toEqual(expected);
  });

  it('should include date intervals for available times outside the schedule', () => {
    const range: DateInterval = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
    };
    const duration = 60;
    const offset = 30;

    const given: Partial<Schedule & WeeklyTimetable>[] = [
      {
        monday: [
          {
            from: '09:00',
            to: '12:00',
          },
        ],
        availabilities: [
          {
            start: parseISO('2020-11-20T11:00:00'),
            end: parseISO('2020-11-20T13:45:00'),
          },
        ],
      },
    ];

    const expected: DateInterval[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
      },
      {
        start: parseISO('2020-11-16T09:30:00'),
        end: parseISO('2020-11-16T10:30:00'),
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
      },
      {
        start: parseISO('2020-11-16T10:30:00'),
        end: parseISO('2020-11-16T11:30:00'),
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
      },

      {
        start: parseISO('2020-11-20T11:00:00'),
        end: parseISO('2020-11-20T12:00:00'),
      },
      {
        start: parseISO('2020-11-20T11:30:00'),
        end: parseISO('2020-11-20T12:30:00'),
      },
      {
        start: parseISO('2020-11-20T12:00:00'),
        end: parseISO('2020-11-20T13:00:00'),
      },
      {
        start: parseISO('2020-11-20T12:30:00'),
        end: parseISO('2020-11-20T13:30:00'),
      },
    ];

    expect(schedulesToDateIntervals(given, range, duration, offset)).toEqual(expected);
  });
});
