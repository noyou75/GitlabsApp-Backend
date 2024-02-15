import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { RecaptchaService } from './recaptcha.service';

/**
 * Guard that protects access to a given endpoint by validating the request's embedded recaptcha token.
 * If the token is valid, endpoint access is permitted; otherwise, it's declined.
 */
export class RecaptchaGuard implements CanActivate {
  @Inject()
  private recaptchaService: RecaptchaService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /* Extract the token from the request */
    const token = context.switchToHttp().getRequest().headers['x-recaptcha-token'];

    /* If the token exists, attempt to validate it; otherwise, return a promise that resolves with false. */
    return await (token ? this.recaptchaService.validateRecaptchaToken(token) : Promise.resolve(false));
  }
}
