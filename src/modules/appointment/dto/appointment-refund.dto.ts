import { IsNotEmpty } from 'class-validator';

export class AppointmentRefundDto {
  @IsNotEmpty()
  reason: string;
}
