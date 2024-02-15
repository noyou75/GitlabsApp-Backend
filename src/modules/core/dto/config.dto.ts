import { Exclude, Expose } from 'class-transformer';
import { BusinessHoursConfig, PatientBookingHours } from '../enums/config.enum';

@Exclude()
export class ConfigDto {
  @Expose()
  public [BusinessHoursConfig.BusinessHoursStart]: string;

  @Expose()
  public [BusinessHoursConfig.BusinessHoursEnd]: string;

  @Expose()
  public [PatientBookingHours.PatientBookingHoursStart]: string;

  @Expose()
  public [PatientBookingHours.PatientBookingHoursEnd]: string;
}
