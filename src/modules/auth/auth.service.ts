import { Injectable, NotImplementedException, Type, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import assert from 'assert';
import { deserialize, plainToClass, serialize } from 'class-transformer';
import { addSeconds } from 'date-fns';
import { Redis } from 'ioredis';
import { some } from 'p-iteration';
import { format } from 'util';
import { className } from '../../common/class.utils';
import { secureid } from '../../common/string.utils';
import { PatientUser, User } from '../../entities/user.entity';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { RedisService } from '../core/services/redis.service';
import { AuthCodeNotification } from '../notification/notifications/auth-code.notification';
import { ContinueBookingOnMobileNotification } from '../notification/notifications/continue-booking-on-mobile.notification';
import { NotificationConfirmation, NotificationService } from '../notification/services/notification.service';
import { StringEncoderService } from '../shared/services/string-encoder.service';
import { PatientUserService } from '../user/patient/patient-user.service';
import { UserFactory } from '../user/user.factory';
import { UserService } from '../user/user.service';
import { AuthKeyDto } from './dto/auth-key.dto';
import { Token } from './jwt/token.interface';

// Auth Terminology
//
//  Auth Code:
//    - short-lived 6 digit numeric code (ex. 123-456)
//    - Generally sent to a secondary device such as a phone that can then be typed
//      in on the primary device to complete authentication.
//    - Codes are tied to a particular phone number and user type, and do not necessarily
//      require a registered user account. For example, once a phone/code combination is
//      validated a new Patient account might be created.
//
//  Auth Key:
//    - short-lived 11 character alphanumeric key (ex. 4XnWF738AYc)
//    - Generally send to a secondary device in link format that can be opened on the
//      secondary device to automatically be authenticated on the secondary device.
//    - Keys are always tied to a particular user through a pre-generated jwt token
//      that is returned when key is used.

@Injectable()
export class AuthService {
  static readonly expiry = 600;
  static readonly codeKey = 'auth-code:%s:%s';
  static readonly linkKey = 'auth-link:%s';

  redis: Redis;

  constructor(
    private readonly users: UserService,
    private readonly patients: PatientUserService,
    private readonly notifications: NotificationService,
    private readonly jwt: JwtService,
    private readonly analytics: AnalyticsService,
    redis: RedisService,
  ) {
    this.redis = redis.getClient();
  }

  async generateCode(type: Type<User>, phoneNumber: string): Promise<string> {
    const code = secureid(6, '0123456789');

    const cacheKey = format(AuthService.codeKey, className(type), phoneNumber);

    // Store hashed code in a redis set to enable multiple codes per phone number. This lets us
    // send different codes via a variety of methods (sms, voice call, etc) and have them all be valid
    // until the codes expire or one of them is validated successfully.
    await new Promise(async (resolve, reject) => {
      const batch = this.redis.multi();

      // Remove expired codes based on their score
      batch.zremrangebyscore(cacheKey, 0, new Date().getTime());

      // Add the code to the set, and use score to keep track of individual code expiry time
      batch.zadd(cacheKey, String(addSeconds(new Date(), AuthService.expiry).getTime()), await StringEncoderService.encode(code));

      // Expire the overall set in the same amount of time as each individual key
      batch.expire(cacheKey, AuthService.expiry);

      await batch.exec((err, res) => {
        err ? reject(err) : resolve(res);
      });
    });

    return code;
  }

  /**
   * Determines if active authentication codes exist for a given phone number and type combo
   */
  async hasActiveCodes(type: Type<User>, phoneNumber: string): Promise<boolean> {
    /* Form the cache key that we are examining. */
    const cacheKey = format(AuthService.codeKey, className(type), phoneNumber);

    const result = await this.redis
      .multi()
      /* Remove expired codes based on their score */
      .zremrangebyscore(cacheKey, 0, new Date().getTime())

      /* Set the query to retrieve the active codes */
      .zrange(cacheKey, 0, -1)
      .exec();

    /* Examine the returned values to determine if there are already active codes set against the supplied
     * role / phone number. */
    return !result[1][0] && !!result[1][1].length;
  }

  async sendCode(code: string, phoneNumber: string, voice?: boolean);
  async sendCode(code: string, recipientDetails: { phoneNumber?: string; email?: string }, voice?: boolean);
  async sendCode(
    code: string,
    phoneNumberOrRecipientDetails:
      | {
          phoneNumber?: string;
          email?: string;
        }
      | string,
    voice?: boolean,
  ): Promise<NotificationConfirmation> {
    /* Narrow the recipient parameter into a consistent type */
    const recipientDetails: { phoneNumber?: string; email?: string } =
      typeof phoneNumberOrRecipientDetails === 'string'
        ? {
            phoneNumber: phoneNumberOrRecipientDetails,
          }
        : phoneNumberOrRecipientDetails;

    return await this.notifications.send(AuthCodeNotification, recipientDetails, { code }, undefined, {
      sms: !!recipientDetails.phoneNumber && !voice,
      voice: !!recipientDetails.phoneNumber && !!voice,
      email: !!recipientDetails.email && !voice,
    });
  }

  async validateCode(type: Type<User>, phoneNumber: string, code: string): Promise<boolean> {
    const cacheKey = format(AuthService.codeKey, className(type), phoneNumber);

    const isValid = await new Promise<boolean>(async (resolve, reject) => {
      const batch = this.redis.multi();
      // Remove expired codes based on their score
      batch.zremrangebyscore(cacheKey, 0, new Date().getTime());

      // Get the rest of the codes
      batch.zrange(cacheKey, 0, -1);

      // Test the codes to see if any match
      await batch.exec(async (err, res) => {
        // Get result of second command (ioredis returns command results in the form of [err, [code1, code2, etc]])
        const hashes = res[1][1];
        err ? reject(err) : resolve(await some(hashes, (hash: string) => StringEncoderService.compare(code, hash)));
      });
    });

    if (isValid) {
      await this.redis.del(cacheKey);
    }

    return isValid;
  }

  async generateKey(user: User, path: string): Promise<string> {
    const key = secureid(11);

    const cacheKey = format(AuthService.linkKey, key);

    // Some basic sanity checks regarding the path (it needs to be an absolute path)
    assert(path.charAt(0) === '/', `Invalid path: ${path}`);

    const token = this.signToken(this.createToken(user));

    // Store hashed code with 10 min expiry
    await this.redis.set(cacheKey, serialize(new AuthKeyDto(token, path)), 'EX', AuthService.expiry);

    return key;
  }

  async sendKey(key: string, user: User): Promise<NotificationConfirmation> {
    return await this.notifications.send(ContinueBookingOnMobileNotification, user, { key });
  }

  async validateKey(key: string): Promise<AuthKeyDto> {
    const cacheKey = format(AuthService.linkKey, key);

    const data = await this.redis.get(cacheKey);

    await this.redis.del(cacheKey);

    return data ? deserialize(AuthKeyDto, data) : null;
  }

  async signInWithPassword(type: Type<User>, username: string, password: string): Promise<string> {
    throw new NotImplementedException();
  }

  async signInWithCode(type: Type<User>, phoneNumber: string, code: string, analyticsToken?: string): Promise<string> {
    if (!(await this.validateCode(type, phoneNumber, code))) {
      throw new UnauthorizedException('auth.code.invalid');
    }

    return this.signToken(this.createToken(await this.loadOrCreateUser(type, phoneNumber, analyticsToken)));
  }

  async signInWithKey(key: string): Promise<AuthKeyDto> {
    const dto = await this.validateKey(key);

    if (!dto || !dto.token) {
      throw new UnauthorizedException('auth.key.invalid');
    }

    return dto;
  }

  async loadUserFromToken(token: Token): Promise<User> {
    return await this.users.findOne(UserFactory.getClassType(token.type), token.id);
  }

  async loadUserByPhoneNumber(type: Type<User>, phoneNumber: string): Promise<User> {
    return await this.users.findOne(type, {
      where: {
        phoneNumber,
      },
    });
  }

  async loadOrCreateUser(type: Type<User>, phoneNumber: string, analyticsToken?: string): Promise<User> {
    let user = await this.loadUserByPhoneNumber(type, phoneNumber);

    if (!user) {
      if (type === PatientUser) {
        // Create new user on login
        user = await this.patients.create(
          plainToClass(PatientUser, {
            phoneNumber,
          }),
          true,
          analyticsToken,
        );

        /* Once the user is created, alias the distinct ID (what was supplied with the request) with the user's ID... */
        analyticsToken && this.analytics.setAlias(analyticsToken, user);
      } else {
        throw new UnauthorizedException('auth.user.invalid');
      }
    } else if (
      user instanceof PatientUser &&
      (!user.partnerReferral ||
        !user.partnerReferral.find((partnerReferral) => {
          return partnerReferral.analyticsTokens && partnerReferral.analyticsTokens.includes(analyticsToken);
        }))
    ) {
      /* If the user is already known, we may be dealing with a new alias for this user.  Mixpanel now supports multiple aliases for a given
       * correct identifier, thus we will track any and all aliases that are known to be associated with the user. */
      this.analytics.setAlias(user.id, analyticsToken);
    }

    return user;
  }

  createToken(user: User): Token {
    if (!user || !(user instanceof User)) {
      throw new UnauthorizedException('auth.user.invalid');
    }

    return {
      id: user.id,
      type: className(user),
    };
  }

  signToken(token: Token): string {
    return this.jwt.sign(token);
  }
}
