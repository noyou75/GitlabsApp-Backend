import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsNumber, IsPostalCode, IsString } from 'class-validator';
import { parse, startOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { AvailabilityQueryDto } from './availability-query.dto';

@Exclude()
export class TimeslotQueryDto extends AvailabilityQueryDto {
  @Expose()
  @Transform(
    (value: string, obj: TimeslotQueryDto) => {
      if (typeof value === 'string') {
        const date = parse(value.trim(), 'yyyy-MM-dd', new Date());

        if (isNaN(date.getTime())) {
          return null;
        }

        /* The original parsed date is sent to us in zoned time.  Convert it to UTC to make better sense of it downstream. */
        return zonedTimeToUtc(startOfDay(date), obj.timezone);
      }

      return undefined;
    },
    { toClassOnly: true },
  )
  @IsDate({ message: '$property must be a date in yyyy-MM-dd format.' })
  from: Date;

  @Expose()
  @IsNumber()
  @Type(() => Number)
  days: number;

  @Expose()
  @IsString()
  @IsPostalCode('US')
  zip: string;
}
