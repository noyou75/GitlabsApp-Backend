import { addDays, isBefore, isSameDay, subDays, subHours } from 'date-fns';

/**
 * Config class that sets the various repeat schemes that are used for scheduling repeatable jobs.
 */
export class RepeatConfig {
  /* Asymptotic retrieves dates that are 7 days, 2 days, and 1 hour before the requested strike date. */
  public static Asymptotic = (strikeDate: Date) => [subDays(strikeDate, 7), subDays(strikeDate, 2), subHours(strikeDate, 1)];

  /* Every day retrieves dates that occur every day from now until the strike date.  The resulting date set
   * contains dates scheduled at the same time-of-day as the strike date for the range of dates described
   * above; this set excludes the current date as well as the strike date. */
  public static EveryDay = (strikeDate: Date) => {
    const dates = [];

    /* The first task should be scheduled for the day after the start date. */
    let iterator = addDays(new Date(), 1);

    /* Normalize iterator to use the same time of day as the supplied strike date. */
    iterator.setHours(strikeDate.getHours(), strikeDate.getMinutes(), strikeDate.getSeconds(), strikeDate.getMilliseconds());

    /* Create a date for every date between the day after today and the strike date. */
    while (isBefore(iterator, strikeDate) && !isSameDay(iterator, strikeDate)) {
      dates.push(iterator);
      iterator = addDays(iterator, 1);
    }

    return dates;
  };
}
