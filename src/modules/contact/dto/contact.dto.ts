import { Exclude, Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';
import { numeric } from '../../../common/string.utils';
import { IsExactLength } from '../../shared/constraints/is-exact-length.constraint';

@Exclude()
export class ContactDto {
  @Expose()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  @IsExactLength(10)
  @Transform(value => (value ? numeric(value) : undefined), { toClassOnly: true })
  phoneNumber: string;

  @Expose()
  @IsNotEmpty()
  message: string;
}
