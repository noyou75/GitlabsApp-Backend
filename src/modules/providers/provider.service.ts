import { Injectable } from '@nestjs/common';
import { GCPConfig, SlackConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { LoggerService } from '../core/services/logger.service';
import { PubQueueService } from '../queue/pub-queue.service';
import { SlackService } from '../slack/slack.service';
import { Provider } from './dto/provider';
import { NewProviderSlackNotificationTemplate } from './templates/new-provider-slack-notification.template';

/**
 * Contains business logic implementations that read/write providers data
 */
@Injectable()
export class ProviderService {
  constructor(
    private readonly queue: PubQueueService,
    private readonly slack: SlackService,
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Publishes the supplied provider details in the providers queue; also creates a NewProviderMessage for the provider,
   * and dispatches the message to slack.
   */
  public async addProvider(provider: Provider) {
    /* Push the supplied provider description into the queue service... */
    const topic = this.config.get(GCPConfig.ProvidersQueueTopic);

    topic &&
      (await this.queue.publishMessage(topic, { provider }).catch(err => {
        this.logger.error(`[ProvidersService#addProvider] Unable to push the supplied provider to the queue; we will still post the ' +
        'provider via slack.  Embedded error: ${err}`);
      }));

    await this.slack.send(this.config.get(SlackConfig.ProvidersChannel), NewProviderSlackNotificationTemplate, {
      provider,
      dateSubmitted: new Date(),
    });
  }
}
