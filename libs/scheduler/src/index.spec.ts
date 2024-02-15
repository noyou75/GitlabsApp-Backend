import { parseISO } from 'date-fns';
import { AvailabilityParameters, EarliestAvailabilityParams, getAvailabilities, getEarliestAvailabilityForMinimumNotice } from './index';
import { Timeslot } from './timeslot';

describe('Availability', () => {
  it('should return timeslots for a single basic schedule', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 1,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should return timeslots with a different offsets for a single basic schedule', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      offset: 30,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T09:30:00'),
        end: parseISO('2020-11-16T10:30:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T10:30:00'),
        end: parseISO('2020-11-16T11:30:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 1,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should return timeslots for a single complex schedule', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
            {
              from: '13:00',
              to: '14:00',
            },
          ],
          friday: [
            {
              from: '09:00',
              to: '12:00',
            },
            {
              from: '13:00',
              to: '14:00',
            },
          ],
          availabilities: [
            {
              start: parseISO('2020-11-18T12:00:00'),
              end: parseISO('2020-11-18T13:00:00'),
            },
          ],
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-18T12:00:00'),
        end: parseISO('2020-11-18T13:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-20T09:00:00'),
        end: parseISO('2020-11-20T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-20T10:00:00'),
        end: parseISO('2020-11-20T11:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-20T11:00:00'),
        end: parseISO('2020-11-20T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-20T13:00:00'),
        end: parseISO('2020-11-20T14:00:00'),
        available: 1,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should return aggregated timeslots for a multiple schedules', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
        {
          monday: [
            {
              from: '10:00',
              to: '13:00',
            },
          ],
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
        available: 1,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should handle blackouts at the individual schedule and global level', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
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
              start: parseISO('2020-11-16T12:00:00'),
              end: parseISO('2020-11-16T17:00:00'),
            },
          ],
        },
        {
          monday: [
            {
              from: '09:00',
              to: '15:00',
            },
          ],
          tuesday: [
            {
              from: '09:00',
              to: '15:00',
            },
          ],
        },
      ],
      blackouts: [
        {
          start: parseISO('2020-11-17T00:00:00'),
          end: parseISO('2020-11-17T23:59:59'),
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 2,
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
        available: 1,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should apply allocations to timeslot availabilities', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
        {
          monday: [
            {
              from: '10:00',
              to: '13:00',
            },
          ],
        },
      ],
      allocations: [
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
          start: parseISO('2020-11-16T11:30:00'),
          end: parseISO('2020-11-16T13:30:00'),
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 1,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should overlay business hours to timeslot availabilities', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
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
        },
      ],
      allocations: [
        {
          start: parseISO('2020-11-16T10:00:00'),
          end: parseISO('2020-11-16T11:00:00'),
        },
      ],
      businessHours: {
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
      holidays: [
        {
          start: parseISO('2020-11-17T00:00:00'),
          end: parseISO('2020-11-17T23:59:59'),
        },
      ],
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T15:00:00'),
        end: parseISO('2020-11-16T16:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T16:00:00'),
        end: parseISO('2020-11-16T17:00:00'),
        available: 0,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should overlay business hours to timeslot availabilities with different offsets', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      offset: 30,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
      allocations: [
        {
          start: parseISO('2020-11-16T10:00:00'),
          end: parseISO('2020-11-16T11:00:00'),
        },
      ],
      businessHours: {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    };

    const expected: Timeslot[] = [
      {
        start: parseISO('2020-11-16T09:00:00'),
        end: parseISO('2020-11-16T10:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T09:30:00'),
        end: parseISO('2020-11-16T10:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T10:00:00'),
        end: parseISO('2020-11-16T11:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T10:30:00'),
        end: parseISO('2020-11-16T11:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T11:00:00'),
        end: parseISO('2020-11-16T12:00:00'),
        available: 1,
      },
      {
        start: parseISO('2020-11-16T11:30:00'),
        end: parseISO('2020-11-16T12:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T12:00:00'),
        end: parseISO('2020-11-16T13:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T12:30:00'),
        end: parseISO('2020-11-16T13:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T13:00:00'),
        end: parseISO('2020-11-16T14:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T13:30:00'),
        end: parseISO('2020-11-16T14:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T14:00:00'),
        end: parseISO('2020-11-16T15:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T14:30:00'),
        end: parseISO('2020-11-16T15:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T15:00:00'),
        end: parseISO('2020-11-16T16:00:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T15:30:00'),
        end: parseISO('2020-11-16T16:30:00'),
        available: 0,
      },
      {
        start: parseISO('2020-11-16T16:00:00'),
        end: parseISO('2020-11-16T17:00:00'),
        available: 0,
      },
    ];

    expect(await getAvailabilities(given)).toEqual(expected);
  });

  it('should throw an error when the date range is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-15T00:00:00'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when the duration is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 0,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when the offset is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      offset: 0,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when a schedule is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '08:00',
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when a schedule start time is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '41:00',
              to: '12:00',
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when a schedule end time is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '24:00',
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when a schedule availability is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
          availabilities: [
            {
              start: parseISO('2020-11-15T00:00:00'),
              end: parseISO('2020-11-15T00:00:00'),
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when a schedule blackout is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
          blackouts: [
            {
              start: parseISO('2020-11-15T00:00:00'),
              end: parseISO('2020-11-15T00:00:00'),
            },
          ],
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when a global blackout is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
      blackouts: [
        {
          start: parseISO('2020-11-15T00:00:00'),
          end: parseISO('2020-11-15T00:00:00'),
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when an allocation is bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
      allocations: [
        {
          start: parseISO('2020-11-15T00:00:00'),
          end: parseISO('2020-11-15T00:00:00'),
        },
      ],
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should throw an error when the business hours are bad', async () => {
    const given: AvailabilityParameters = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-21T23:59:59'),
      duration: 60,
      schedules: [
        {
          monday: [
            {
              from: '09:00',
              to: '12:00',
            },
          ],
        },
      ],
      businessHours: {
        monday: [
          {
            from: '09:00',
            to: '12:00',
          },
          {
            from: '13:00',
            to: '12:00',
          },
        ],
      },
    };

    await expect(getAvailabilities(given)).rejects.toThrow(Error);
  });

  it('should return the earliest available time for a given minimum notice for a single basic schedule', async () => {
    const given: EarliestAvailabilityParams = {
      start: parseISO('2020-11-15T00:00:00'),
      minimumNotice: 4 * 60,
      schedule: {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    };

    const expected: Date = parseISO('2020-11-16T13:00:00');

    expect(await getEarliestAvailabilityForMinimumNotice(given)).toEqual(expected);
  });

  it('should return the earliest available time for a given minimum notice for a complex schedule', async () => {
    const given: EarliestAvailabilityParams = {
      start: parseISO('2020-11-15T00:00:00'),
      minimumNotice: 4 * 60,
      schedule: {
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
    };

    const expected: Date = parseISO('2020-11-16T14:00:00');

    expect(await getEarliestAvailabilityForMinimumNotice(given)).toEqual(expected);
  });

  it('should return the earliest available time for a given minimum notice for a complex multi day schedule', async () => {
    const given: EarliestAvailabilityParams = {
      start: parseISO('2020-11-15T00:00:00'),
      minimumNotice: 12 * 60,
      schedule: {
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
        friday: [
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
    };

    const expected: Date = parseISO('2020-11-20T15:00:00');

    expect(await getEarliestAvailabilityForMinimumNotice(given)).toEqual(expected);
  });

  it('should throw an error when the minimum notice is bad', async () => {
    const given: EarliestAvailabilityParams = {
      start: parseISO('2020-11-15T00:00:00'),
      minimumNotice: -60,
      schedule: {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    };

    await expect(getEarliestAvailabilityForMinimumNotice(given)).rejects.toThrow(Error);
  });

  it('should throw an error when the date range is bad', async () => {
    const given: EarliestAvailabilityParams = {
      start: parseISO('2020-11-15T00:00:00'),
      end: parseISO('2020-11-14T00:00:00'),
      minimumNotice: 4 * 60,
      schedule: {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    };

    await expect(getEarliestAvailabilityForMinimumNotice(given)).rejects.toThrow(Error);
  });

  it('should return null when it cannot find the earliest availability in the given date range', async () => {
    const given: EarliestAvailabilityParams = {
      minimumNotice: 24 * 60,
      schedule: {
        monday: [
          {
            from: '09:00',
            to: '17:00',
          },
        ],
      },
    };

    const expected: Date = null;

    expect(await getEarliestAvailabilityForMinimumNotice(given)).toEqual(expected);
  });
});
