import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { DateInterval } from './interval';
import { Schedule, timetableToSchedule, WeeklyTimetable } from './timetable';

describe('Timetables', () => {
  it('should throw a range error if the range is invalid', () => {
    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-21')),
    };

    expect(() => timetableToSchedule({}, range)).toThrow(RangeError);
  });

  it('should return no intervals if none of the days in the range are in the timetable', () => {
    const timetable: WeeklyTimetable = {
      monday: [
        {
          from: '09:00',
          to: '17:00',
        },
      ],
    };

    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-22')),
    };

    const expected: Schedule = {
      availabilities: [],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });

  it('should convert an uninterrupted single day schedule to an interval between a range', () => {
    const timetable: WeeklyTimetable = {
      monday: [
        {
          from: '09:00',
          to: '17:00',
        },
      ],
    };

    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-28')),
    };

    const expected: Schedule = {
      availabilities: [
        {
          start: parseISO('2020-11-23T09:00:00'),
          end: parseISO('2020-11-23T17:00:00'),
        },
      ],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });

  it('should convert an interrupted single day schedule to multiple intervals between a range', () => {
    const timetable: WeeklyTimetable = {
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
    };

    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-28')),
    };

    const expected: Schedule = {
      availabilities: [
        {
          start: parseISO('2020-11-23T09:00:00'),
          end: parseISO('2020-11-23T12:00:00'),
        },
        {
          start: parseISO('2020-11-23T13:00:00'),
          end: parseISO('2020-11-23T17:00:00'),
        },
      ],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });

  it('should convert an interrupted but adjacent single day schedule to an interval between a range', () => {
    const timetable: WeeklyTimetable = {
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
    };

    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-28')),
    };

    const expected: Schedule = {
      availabilities: [
        {
          start: parseISO('2020-11-23T09:00:00'),
          end: parseISO('2020-11-23T17:00:00'),
        },
      ],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });

  it('should convert an uninterrupted multi day schedule to multiple intervals between a range', () => {
    const timetable: WeeklyTimetable = {
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
    };

    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-28')),
    };

    const expected: Schedule = {
      availabilities: [
        {
          start: parseISO('2020-11-23T09:00:00'),
          end: parseISO('2020-11-23T17:00:00'),
        },
        {
          start: parseISO('2020-11-24T09:00:00'),
          end: parseISO('2020-11-24T17:00:00'),
        },
      ],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });

  it('should convert an interrupted multi day schedule to multiple intervals between a range', () => {
    const timetable: WeeklyTimetable = {
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
    };

    const range: DateInterval = {
      start: startOfDay(parseISO('2020-11-22')),
      end: endOfDay(parseISO('2020-11-28')),
    };

    const expected: Schedule = {
      availabilities: [
        {
          start: parseISO('2020-11-23T09:00:00'),
          end: parseISO('2020-11-23T12:00:00'),
        },
        {
          start: parseISO('2020-11-23T13:00:00'),
          end: parseISO('2020-11-23T17:00:00'),
        },
        {
          start: parseISO('2020-11-24T09:00:00'),
          end: parseISO('2020-11-24T12:00:00'),
        },
        {
          start: parseISO('2020-11-24T13:00:00'),
          end: parseISO('2020-11-24T17:00:00'),
        },
      ],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });

  it('should clamp the date intervals to be in between the range', () => {
    const timetable: WeeklyTimetable = {
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
    };

    const range: DateInterval = {
      start: parseISO('2020-11-23T13:00:00'),
      end: parseISO('2020-11-24T13:00:00'),
    };

    const expected: Schedule = {
      availabilities: [
        {
          start: parseISO('2020-11-23T13:00:00'),
          end: parseISO('2020-11-23T17:00:00'),
        },
        {
          start: parseISO('2020-11-24T09:00:00'),
          end: parseISO('2020-11-24T13:00:00'),
        },
      ],
      blackouts: [],
    };

    expect(timetableToSchedule(timetable, range)).toEqual(expected);
  });
});
