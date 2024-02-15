import { isBefore } from 'date-fns';
import { SimpleTimeRange } from '../../shared/util/time.util';
import { DateTransformFn } from '../types/repeat-type';

/**
 * Massages the inbound dates to comply with the supplied time range bounds in the supplied timezone.
 */
export const getCompliantDates = (inputDates: Date | Date[], tz, timeRange?: SimpleTimeRange, transformDate?: DateTransformFn): Date[] => {
  /* If the input date is a single date, transform it to an array for even handling... */
  return (Array.isArray(inputDates) ? inputDates : [inputDates]).reduce((accum: Date[], jobScheduling) => {
    /* If transformDate is supplied, execute that now... */
    let js = transformDate ? transformDate(jobScheduling) : jobScheduling;

    /* Convert inbound Date objects to instances of JobScheduling for easy comparison */
    js =
      js instanceof Date
        ? {
            date: js,
            isPermittedOutsideHours: false,
          }
        : js;

    /* Dates in the past are not permitted. */
    if (!isBefore(js.date, new Date())) {
      accum.push(!timeRange || js.isPermittedOutsideHours ? js.date : timeRange.toBoundCompliantDate(js.date, tz));
    }

    /* The time of each scheduled notification must be restricted to an acceptable window, unless otherwise stated. */
    return accum;
  }, []);
};
