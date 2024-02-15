import { Exclude, Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';
import { numeric } from '../../../common/string.utils';
import { IsExactLength } from '../../shared/constraints/is-exact-length.constraint';

/**
 * Describes a provider object that is submitted from the front end via the providers input form.
 */
@Exclude()
export class Provider {
  @Expose()
  @IsNotEmpty()
  name: string;

  @Expose()
  title: string;

  @Expose()
  @IsNotEmpty()
  organization: string;

  @Expose()
  specialty: string;

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
  address: string;
}
