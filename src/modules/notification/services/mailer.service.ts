import { Injectable } from '@nestjs/common';
import { createTransport, SendMailOptions, SentMessageInfo, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { className } from '../../../common/class.utils';
import { NotificationConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';

@Injectable()
export class MailerService {
  private readonly transporter: Transporter;

  constructor(
    transport: SMTPTransport | SMTPTransport.Options | string,
    defaults: SMTPTransport.Options,
    private readonly rateLimiter: RateLimitService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.transporter = createTransport(transport, defaults);
  }

  async send(to: string, subject: string, content: string, options?: SendMailOptions): Promise<SentMessageInfo | undefined> {
    // Apply rate limiting to email sending. This type of rate limiting is invisible to the requester!
    if (!(await this.rateLimiter.isRateLimited(`mail:${to}`, { interval: 60, limit: 12 }))) {
      // This prevents sending emails to actual destinations unless we are in production mode
      // In dev mode, the email override env var must be set and all emails will be sent there
      to = this.config.isProduction() ? to : this.config.get(NotificationConfig.EmailAddress);

      if (to) {
        this.logger.info(`${className(this)}: Sending email => ${to}`);
        return await this.transporter.sendMail({
          to,
          subject,
          html: content,
          ...(options || {}),
        });
      } else {
        this.logger.warn(`${className(this)}: Email destination has not been set!`);
      }
    } else {
      this.logger.warn(`${className(this)}: Unable to send email because destination is rate limited => ${to}`);
    }
  }
}
