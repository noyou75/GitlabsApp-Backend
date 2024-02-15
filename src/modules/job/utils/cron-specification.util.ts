/**
 * Defines a cron specification - each value should be a cron-friendly value corresponding to that particular field in a
 * resulting crontab string.
 */
export interface CronSpecificationParams {
  minutes?: string;
  hours?: string;
  days?: string;
  month?: string;
  dayOfWeek?: string;
}

/**
 * Helper class that assists with the construction of cron specifications given a set of dates.
 */
export class CronSpecificationUtil {
  /**
   * Assembles a cron specification string from the supplied set of dates and overrides.  Any fields set in the overrides parameter
   * will be set as the corresponding sole field value in the resulting cron string.
   */
  static getCronSpec(dates: Date[] | undefined, overrides?: CronSpecificationParams): string {
    return (
      ((overrides && overrides.minutes) || CronSpecificationUtil.getCronDef(dates, date => date.getMinutes()) || '*') +
      ' ' +
      ((overrides && overrides.hours) || CronSpecificationUtil.getCronDef(dates, date => date.getHours()) || '*') +
      ' ' +
      ((overrides && overrides.days) || CronSpecificationUtil.getCronDef(dates, date => date.getDate()) || '*') +
      ' ' +
      ((overrides && overrides.month) || CronSpecificationUtil.getCronDef(dates, date => date.getMonth() + 1) || '*') +
      ' ' +
      ((overrides && overrides.dayOfWeek) || ' *')
    );
  }

  /**
   * Retrieves a crontab-friendly field definition for values returned by the supplied callback when invoked by the supplied date(s).
   */
  private static getCronDef(days: Date[] | undefined, callback: (dt: Date) => number): string {
    return (
      days &&
      days.reduce((accumulator, dt, idx) => {
        accumulator = accumulator + callback(dt) + (idx < days.length - 1 ? ',' : '');
        return accumulator;
      }, '')
    );
  }
}
