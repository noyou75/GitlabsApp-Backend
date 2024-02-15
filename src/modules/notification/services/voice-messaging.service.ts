import { Inject, Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { CallInstance, CallListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/call';
import { className } from '../../../common/class.utils';
import { TWILIO_CLIENT } from '../../../common/constants';
import { NotificationConfig, TwilioConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';

@Injectable()
export class VoiceMessagingService {
  constructor(
    @Inject(TWILIO_CLIENT) private readonly client: Twilio,
    private readonly rateLimiter: RateLimitService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async send(to: string, twiml: string, opts?: CallListInstanceCreateOptions): Promise<CallInstance | undefined> {
    // Apply rate limiting to sending sms messages. This type if rate limiting is invisible to the requester!
    if (!(await this.rateLimiter.isRateLimited(`voice:${to}`, { interval: 60, limit: 4 }))) {
      // This prevents sending messages to actual destinations unless we are in production mode
      // In dev mode, the phone number override env var must be set and all messages will be sent there
      to = this.config.isProduction() ? to : this.config.get(NotificationConfig.PhoneNumber);

      if (to) {
        this.logger.info(`${className(this)}: Sending voice message => ${to}`);
        return await this.client.calls.create({
          to,
          from: this.config.get(TwilioConfig.SourcePhoneNumber),
          twiml,
          ...opts,
        });
      } else {
        this.logger.warn(`${className(this)}: Voice call destination has not been set!`);
      }
    } else {
      this.logger.warn(`${className(this)}: Unable to send voice message because destination is rate limited => ${to}`);
    }
  }
}
