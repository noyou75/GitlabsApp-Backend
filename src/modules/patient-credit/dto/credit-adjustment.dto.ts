import { Exclude, Expose } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

@Exclude()
export class CreditAdjustmentDto {
  @IsNumber()
  @IsPositive()
  @Expose()
  public amount: number;
}
