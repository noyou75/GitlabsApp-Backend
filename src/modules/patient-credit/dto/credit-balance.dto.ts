import { Exclude, Expose } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

@Exclude()
export class CreditBalanceDto {
  @IsNumber()
  @Min(0)
  @Expose()
  balance: number;
}
