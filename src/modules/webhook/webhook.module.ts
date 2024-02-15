import { Module } from '@nestjs/common';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookHandlerService } from './webhook.decorator';

@Module({
  controllers: [WebhookController],
  providers: [
    StripeWebhookService,
    WebhookHandlerService,
  ],
})
export class WebhookModule {}
