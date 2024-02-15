import { Injectable, Type } from '@nestjs/common';
import { BusinessHoursConfig, PatientBookingHours } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { HolidayService } from '../../core/services/holiday.service';
import { SimpleTime, SimpleTimeRange } from '../util/time.util';

/**
 * Provides an interface for accessing the various hour bounds we apply to business operations.
 */
@Injectable()
export class OperatingHoursService {
  constructor(private readonly configService: ConfigService, private readonly holidayService: HolidayService) {}

  private _OperatingHoursRange: Type<SimpleTimeRange>;

  private get OperatingHoursRange(): Type<SimpleTimeRange> {
    /* If no definition has been set for _OperatingHoursRange, set one now... */
    if (!this._OperatingHoursRange) {
      const Outer = this;

      /* Definition of the inner class that automatically supplies holiday skipping behaviours (required to be supplied in
       * a NestJS-managed context.) */
      this._OperatingHoursRange = class extends SimpleTimeRange {
        toBoundCompliantDate(
          date: Date,
          tz?: string,
          options: {
            pushToNextDay?: boolean;
            businessDaysOnly?: boolean;
            skipDateCb?: (d: Date) => boolean;
          } = {},
        ): Date {
          return super.toBoundCompliantDate(date, tz, {
            ...options,
            skipDateCb: d => Outer.holidayService.isHoliday(d),
          });
        }

        addTime(
          date: Date,
          milliseconds: number,
          tz?: string,
          options: {
            businessDaysOnly?: boolean;
            skipDateCb?: (d: Date) => boolean;
          } = {},
        ): Date {
          return super.addTime(date, milliseconds, tz, {
            ...options,
            skipDateCb: d => Outer.holidayService.isHoliday(d),
          });
        }
      };
    }

    return this._OperatingHoursRange;
  }

  /**
   * Retrieves the standard BUSINESS operating hours (i.e. the unrestricted hours at which we can perform operations)
   */
  getBusinessHours(): SimpleTimeRange {
    /* Retrieve the business hours from the app config. */
    return this.getTimeRangeFromConfig(BusinessHoursConfig.BusinessHoursStart, BusinessHoursConfig.BusinessHoursEnd);
  }

  /**
   * Retrieves the allowable patient booking hours (i.e. the hours in which we permit patients to book appointments)
   */
  getPatientBookingHours(): SimpleTimeRange {
    return this.getTimeRangeFromConfig(PatientBookingHours.PatientBookingHoursStart, PatientBookingHours.PatientBookingHoursEnd);
  }

  private getTimeRangeFromConfig(startKey: string, endKey: string): SimpleTimeRange {
    return new this.OperatingHoursRange(new SimpleTime(this.configService.get(startKey)), new SimpleTime(this.configService.get(endKey)));
  }
}
