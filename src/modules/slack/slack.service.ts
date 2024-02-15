import { Injectable, Type } from '@nestjs/common';
import { WebAPICallResult, WebClient } from '@slack/web-api';
import { LoggerService } from '../core/services/logger.service';
import { TemplatingService } from '../templating/services/templating.service';
import { Template } from '../templating/template';

/**
 * Primary interface for interacting with Slack.
 */
@Injectable()
export class SlackService {
  constructor(private readonly slack: WebClient, private readonly templating: TemplatingService, private readonly logger: LoggerService) {}

  public async send(channel: string, message: Type<Template> | string, params?: { [k: string]: any });
  public async send(channel: string, message: string, params?: { [k: string]: any }): Promise<WebAPICallResult> {
    try {
      if (typeof message !== 'string') {
        message = await this.templating.render(message, params);
      }

      return await this.slack.chat.postMessage({
        channel,
        text: message,
        as_user: true,
      });
    } catch (err) {
      this.logger.error(`Unable to send slack notification: ${err}`);
    }
  }
}
