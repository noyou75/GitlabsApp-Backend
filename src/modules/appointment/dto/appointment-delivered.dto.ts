import { IsNotEmpty } from 'class-validator';

export class AppointmentDeliveredDto {
  @IsNotEmpty()
  recipient: string;

  @IsNotEmpty()
  signature: string;
}
