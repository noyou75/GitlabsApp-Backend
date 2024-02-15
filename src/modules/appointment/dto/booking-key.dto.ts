import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

@Exclude()
export class BookingKeyDto {
  @IsNotEmpty()
  @Expose()
  key: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  useCredits?: boolean;
}
