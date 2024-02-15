import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class PaymentIntentDto {
  @IsNotEmpty()
  @Expose()
  paymentIntentId: string;
}
