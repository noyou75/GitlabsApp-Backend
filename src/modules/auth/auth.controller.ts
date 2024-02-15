import { Body, Controller, Headers, Param, Post, Type, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { PatientUser, SpecialistUser, StaffUser, User } from '../../entities/user.entity';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { ICrudService } from '../api/crud/crud.service';
import { AuthCodeFailedAnalyticsEvent, AuthCodeRequestAnalyticsEvent, AuthCodeSuccessAnalyticsEvent } from './auth-analytics.event';
import { AuthService } from './auth.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { AuthDto } from './dto/auth.dto';
import { ChangePhoneNumberDto } from './dto/change-phone-number.dto';
import { RolesGuard } from './roles.guard';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { UserFactory } from '../user/user.factory';
import { UserService } from '../user/user.service';

// Default rate limit for auth endpoints (differs from global rate limit)
const authRateLimit = { interval: 60, limit: 6 };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UserService, private readonly analytics: AnalyticsService) {}

  @Post()
  @RateLimit(authRateLimit)
  async patient(@Body() dto: AuthDto, @Headers('x-analytics-token') analyticsToken?: string) {
    return await this.authByCode(PatientUser, dto, analyticsToken);
  }

  @Post('specialist')
  @RateLimit(authRateLimit)
  async specialist(@Body() dto: AuthDto) {
    return await this.authByCode(SpecialistUser, dto);
  }

  @Post('staff')
  @RateLimit(authRateLimit)
  async staff(@Body() dto: AuthDto) {
    return await this.authByCode(StaffUser, dto);
  }

  @Post('phone-number')
  @UseGuards(AuthGuard(), RolesGuard)
  @RateLimit(authRateLimit)
  async phoneNumber(@Body() dto: ChangePhoneNumberDto) {
    const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);
    const type = UserFactory.getClassType(user.constructor.name);

    if (dto.phoneNumber) {
      user.phoneNumber = dto.phoneNumber;

      // Validate the given phone number
      await (this.users.getService(type) as ICrudService<User, Repository<User>>).validate(user);

      if (dto.code) {
        if (!(await this.auth.validateCode(type, dto.phoneNumber, dto.code))) {
          throw new UnauthorizedException('auth.code.invalid');
        }

        await this.users.getRepository(type).save(user);

        return new AuthTokenDto(this.auth.signToken(this.auth.createToken(user)));
      } else {
        await this.requestCode(type, dto.phoneNumber);
        return new AuthTokenDto(undefined, 'auth.code.dispatched');
      }
    }

    throw new UnauthorizedException();
  }

  // Catch-all route, this should be the last route in this controller
  @Post(':key')
  @RateLimit(authRateLimit)
  async key(@Param() params) {
    return await this.authByKey(params.key);
  }

  // ---

  private async authByCode(type: Type<User>, dto: AuthDto, analyticsToken?: string): Promise<AuthTokenDto> {
    /* If the username is not present in the dto, return now. */
    if (!dto.username) {
      return;
    }

    /* If the password or passcode are not defined, then we are dealing with a code request. */
    if (!dto.password && !dto.code) {
      await this.requestCode(type, dto.username, dto.voice);
      analyticsToken && this.analytics.trackEvent(new AuthCodeRequestAnalyticsEvent(type, dto.source));

      return new AuthTokenDto(undefined, 'auth.code.dispatched');
    }

    /* From this point on, we are dealing with an auth request. */
    let token;

    try {
      token = new AuthTokenDto(
        await (dto.password
          ? this.auth.signInWithPassword(type, dto.username, dto.password)
          : this.auth.signInWithCode(type, dto.username, dto.code, analyticsToken)),
      );
    } catch (err) {
      /* Exception encountered, the authentication request failed. */
      err && err.status === 401 && analyticsToken && this.analytics.trackEvent(new AuthCodeFailedAnalyticsEvent(type, dto.source));
      throw err;
    }

    /* If no exceptions are encountered, that means the authentication request succeeded. */
    analyticsToken && this.analytics.trackEvent(new AuthCodeSuccessAnalyticsEvent(type, dto.source));

    return token;
  }

  private async requestCode(type: Type<User>, phoneNumber: string, voice?: boolean): Promise<void> {
    /* If an active code (or active codes) already exist for the supplied type and phone number combination, then we will dispatch
     * the newly-generated code by email as well. */
    const recipient = {
      phoneNumber,
      email:
        type !== PatientUser && (await this.auth.hasActiveCodes(type, phoneNumber))
          ? (
              await this.users.findOne(type, {
                where: {
                  phoneNumber,
                },
              })
            )?.email
          : null,
    };

    await this.auth.sendCode(await this.auth.generateCode(type, phoneNumber), recipient, voice);
  }

  private async authByKey(key: string): Promise<AuthTokenDto> {
    if (key) {
      const dto = await this.auth.signInWithKey(key);
      if (dto) {
        return new AuthTokenDto(dto.token, undefined, dto.redirect);
      }
    }

    throw new UnauthorizedException();
  }
}
