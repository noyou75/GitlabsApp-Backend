import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { RecaptchaModule } from '../recaptcha/recaptcha.module';
import { SlackModule } from '../slack/slack.module';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [QueueModule, SlackModule, RecaptchaModule],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}
