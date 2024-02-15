import { Exclude, Expose } from 'class-transformer';

// This class represents a short-lived key code that can be used to authenticate as the user
// that generated it. This is useful for sending links to other devices that will automatically
// authenticate the user and redirect to a desired location.

@Exclude()
export class AuthKeyDto {
  @Expose()
  token: string;

  @Expose()
  redirect: string;

  constructor(token: string, redirect: string) {
    this.token = token;
    this.redirect = redirect;
  }
}
