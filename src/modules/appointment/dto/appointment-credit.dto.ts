import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

@Exclude()
export class AppointmentCreditDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  public paymentIntentId: string;

  @IsNumber()
  @IsPositive()
  @Expose()
  public amount: number;
}
