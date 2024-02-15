import { Module } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { SlackConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { TemplatingModule } from '../templating/templating.module';
import { SlackService } from './slack.service';

@Module({
  imports: [TemplatingModule],
  providers: [
    SlackService,
    {
      provide: WebClient,
      useFactory: (configService: ConfigService) => {
        /* Initialize the slack web client with the supplied token. */
        return new WebClient(configService.get(SlackConfig.Token));
      },
      inject: [ConfigService],
    },
  ],
  exports: [SlackService],
})
export class SlackModule {}
