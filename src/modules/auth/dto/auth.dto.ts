import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsOptional } from 'class-validator';
import { numeric } from '../../../common/string.utils';

@Exclude()
export class AuthDto {
  @IsDefined()
  @Transform(value => numeric(value)) // TODO: Update this when more than just phone numbers are supported
  @Expose()
  username: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  voice?: boolean;

  @IsOptional()
  @Transform(value => (value ? numeric(value) : undefined))
  @Expose()
  code?: string;

  @IsOptional()
  @Expose()
  password?: string;

  @IsOptional()
  @Expose()
  source?: string;
}
