import { Injectable } from '@nestjs/common';
import Holidays, { HolidaysInterface } from 'date-holidays';

@Injectable()
export class HolidayService {
  private readonly ignoredHolidays: string[] = ['Columbus Day', 'Veterans Day', "Washington's Birthday"];

  private readonly holidays: HolidaysInterface;

  constructor() {
    this.holidays = new Holidays('US', { timezone: 'UTC' });

    // Add some custom holidays
    this.holidays.setHoliday('friday after 4th thursday in November', {
      name: {
        en: 'Day after Thanksgiving Day',
      },
      type: 'public', // Technically an observed holiday, but we only consider public holidays
    });
  }

  isHoliday(date: Date): boolean {
    const holiday = this.holidays.isHoliday(date);
    return holiday && holiday.type === 'public' && !this.ignoredHolidays.includes(holiday.name);
  }
}
