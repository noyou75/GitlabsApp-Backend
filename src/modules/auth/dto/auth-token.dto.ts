import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthTokenDto {
  @Expose()
  token?: string;

  @Expose()
  message?: string;

  @Expose()
  redirect?: string;

  constructor(token?: string, message?: string, redirect?: string) {
    this.token = token;
    this.message = message;
    this.redirect = redirect;
  }
}
