import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDefined, IsOptional } from 'class-validator';
import { numeric } from '../../../common/string.utils';

@Exclude()
export class ChangePhoneNumberDto {
  @IsDefined()
  @Transform(value => numeric(value))
  @Expose()
  phoneNumber: string;

  @IsOptional()
  @Transform(value => (value ? numeric(value) : undefined))
  @Expose()
  code?: string;
}
