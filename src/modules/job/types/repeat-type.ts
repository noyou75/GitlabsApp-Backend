import { isBefore } from 'date-fns';
import { SimpleTimeRange } from '../../shared/util/time.util';
import { RepeatConfig } from '../queue.config';
import { getCompliantDates } from '../utils/scheduling.utils';

/**
 * Defines the scheduling of a notification job.  isPermittedOutsideHours defaults to false.
 */
interface JobScheduling {
  date: Date;
  isPermittedOutsideHours?: boolean;
}

export type DateTransformFn = (date: Date) => Date | JobScheduling;

/**
 * Defines repeatable job scheduling schemes for common scheduling methods.  The common scheduling methods are exposed
 * by this class as static members, which can each supply a series of execution dates (or cronable dates) according to
 * a supplied 'strikeDate' (i.e. the date of a particular event which marks the end of the repeat) in accordance with
 * the corresponding scheme.
 */
export class RepeatType {
  constructor(private _getDates: (strikeDate: Date) => Date[]) {}

  /**
   * Retrieves crontab-friendly groupings of execution dates for this repeat scheme.  The resulting value will be a
   * 2D array of dates, where each element in the parent collection indicates a group of dates that can be
   * collapsed into a single cron definition, and each element in the secondary collection represents an execution
   * date.
   */
  public getCronibleDates(strikeDate: Date, tz?: string, restrictedTimeRange?: SimpleTimeRange, transformDate?: DateTransformFn): Date[][] {
    const dates = this.getCompliantDates(strikeDate, tz, restrictedTimeRange, transformDate);

    /* Organize the retrieved dates into cron-able groups.  This means sorting by dates that have the same hour/minute */
    return Object.values(
      dates.reduce((reduced, date) => {
        /* Key all date groups by their minute/hour */
        const key = date.getHours().toString() + date.getMinutes().toString();

        if (!reduced[key]) {
          reduced[key] = [];
        }

        /* Push the date into the resolved key, as long as it's not before the current date/time */
        isBefore(new Date(), date) && reduced[key].push(date);
        return reduced;
      }, {}),
    );
  }

  /**
   * Retrieves execution dates for this repeat scheme.
   */
  public getDates(strikeDate: Date, tz?: string, restrictedTimeRange?: SimpleTimeRange, transformDate?: DateTransformFn): Date[] {
    return this.getCompliantDates(strikeDate, tz, restrictedTimeRange, transformDate);
  }

  /**
   * Retrieves execution dates that are compliant with configurable time bounds.
   */
  private getCompliantDates(strikeDate, tz, timeRange?: SimpleTimeRange, transformDate?: DateTransformFn): Date[] {
    return getCompliantDates(this._getDates(strikeDate), tz, timeRange, transformDate);
  }

  public static Asymptotic = new RepeatType(RepeatConfig.Asymptotic);
  public static EveryBusinessDay = new RepeatType(RepeatConfig.EveryDay);
}
