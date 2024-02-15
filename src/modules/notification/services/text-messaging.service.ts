import { Inject, Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { Sid } from 'twilio/lib/interfaces';
import { MessageInstance, MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';
import { className } from '../../../common/class.utils';
import { TWILIO_CLIENT } from '../../../common/constants';
import { numeric } from '../../../common/string.utils';
import { NotificationConfig, TwilioConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';

@Injectable()
export class TextMessagingService {
  constructor(
    @Inject(TWILIO_CLIENT) private readonly client: Twilio,
    @Inject(TwilioConfig.AuthMSSID) private readonly mssid: string,
    private readonly rateLimiter: RateLimitService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async send(to: string, body: string, opts?: MessageListInstanceCreateOptions): Promise<MessageInstance | undefined> {
    // Blacklist numbers matching 111-111-xxxx
    if (numeric(to).startsWith('111111')) {
      this.logger.warn(`${className(this)}: Not sending text message because destination is black listed => ${to}`);
      return;
    }

    // Apply rate limiting to sending sms messages. This type if rate limiting is invisible to the requester!
    if (!(await this.rateLimiter.isRateLimited(`sms:${to}`, { interval: 60, limit: 4 }))) {
      // This prevents sending messages to actual destinations unless we are in production mode
      // In dev mode, the phone number override env var must be set and all messages will be sent there
      to = this.config.isProduction() ? to : this.config.get(NotificationConfig.PhoneNumber);

      if (to) {
        this.logger.info(`${className(this)}: Sending text message => ${to}`);
        return ((await this.client.messages.create({
          to,
          from: this.config.get(TwilioConfig.SourcePhoneNumber),
          body,
          messagingServiceSid: this.mssid,
          provideFeedback: true,
          ...opts,
        })) as unknown) as MessageInstance;
      } else {
        this.logger.warn(`${className(this)}: SMS destination has not been set!`);
      }
    } else {
      this.logger.warn(`${className(this)}: Unable to send text message because destination is rate limited => ${to}`);
    }
  }

  async confirm(sid: Sid) {
    this.logger.info(`${className(this)}: Confirming text message => ${sid}`);
    return await this.client.messages.get(sid).feedback.create({ outcome: 'confirmed' });
  }
}
