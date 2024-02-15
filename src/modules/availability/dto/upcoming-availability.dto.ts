import { Exclude, Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { AppointmentBookingTypes } from '../../../common/enums/appointment-booking-types.enum';

@Exclude()
export class UpcomingAvailabilityDto {
  @IsIn(enumValues(AppointmentBookingTypes))
  @Expose()
  type: AppointmentBookingTypes;
}
