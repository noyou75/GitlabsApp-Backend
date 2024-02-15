import { Exclude, Expose, Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsDate, IsIn } from 'class-validator';
import { parse } from 'date-fns';
import { enumValues } from '../../../common/enum.utils';
import { AppointmentBookingTypes } from '../../../common/enums/appointment-booking-types.enum';
import { DaySlotsDto } from './day-slots.dto';

@Exclude()
export class AvailabilityDto {
  @Transform(
    (value) =>
      String(value)
        .split(',')
        .filter((date) => !!date)
        .map((date) => parse(date.trim(), 'yyyy-MM-dd', new Date())),
    { toClassOnly: true },
  )
  @ArrayNotEmpty({ message: '$property must contain at least one valid date in form of YYYY-MM-DD' })
  @ArrayMaxSize(28, { message: '$property must not contain more than $constraint1 dates' })
  @IsDate({ each: true, message: '$property must one or more valid dates in the form of YYYY-MM-DD separated by a comma' })
  @Expose()
  dates: Date[];

  @IsIn(enumValues(AppointmentBookingTypes))
  @Expose()
  type: AppointmentBookingTypes;
}

//
//  TODO: Refactor these DTOs when timekit integration is remove
//

@Exclude()
export class AvailabilityResponseDto {
  @Expose()
  serviceable: boolean;

  @Expose()
  data: DaySlotsDto[];

  @Expose()
  tz: string;

  constructor(serviceable: boolean, data: DaySlotsDto[], tz: string) {
    this.serviceable = serviceable;
    this.data = data;
    this.tz = tz;
  }
}
