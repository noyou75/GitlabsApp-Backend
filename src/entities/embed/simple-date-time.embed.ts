import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsMilitaryTime, IsNotEmpty, IsString } from 'class-validator';
import { format, parse } from 'date-fns';
import { IsDateString } from '../../modules/shared/constraints/is-date-string.constraint';

@Exclude()
export class SimpleDateTime {
  @IsString()
  @IsNotEmpty()
  @IsDateString('yyyy-MM-dd')
  @Expose()
  date: string;

  @IsString()
  @IsNotEmpty()
  @IsMilitaryTime()
  @Expose()
  time: string;     // hh:mm

  public toDate() {
    /* If neither the date nor time are set, throw an exception. */
    if (!this.date && !this.time) {
      throw new Error(`Cannot convert SimpleDateTime object to Date object - at least one of the date/time properties must be set.`);
    }

    /* Parse a date from the current date/time fields.  Date is normalized to today is no date is supplied.
     * Time is normalized to midnight if no time is supplied. */
    return parse(`${ this.date || format(new Date(), 'yyyy-MM-dd') } ${ this.time || '00:00' }`,
      'yyyy-MM-dd HH:mm', new Date());
  }

  public static fromDate(date: Date) {
    /* If the inbound date is not valid, throw an exception. */
    if (!date) {
      throw new Error(`Cannot create instance of SimpleDateTime from a null/undefined data parameter.`);
    }

    /* Parse out the date/time components from the supplied date and return a new object */
    return plainToClass(SimpleDateTime, {
      date: format(date, 'yyyy-MM-dd'),
      time: format(date, 'HH:mm'),
    })
  }
}
