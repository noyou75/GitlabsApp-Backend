import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../../core/services/stripe.service';
import { WebhookHandlerService, WebhookType } from '../webhook.decorator';

@Injectable()
export class StripeWebhookService {
  constructor(
    private readonly stripe: StripeService,
    private readonly webhookHandlerService: WebhookHandlerService,
  ) {}

  async handleWebhook(req: Request): Promise<void> {
    let evt;

    try {
      evt = this.stripe.createWebhookEvent(req);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    /* Find the handler(s) corresponding to the emitted event type */
    return Promise.all(this.webhookHandlerService.getHandlers(WebhookType.Stripe, evt.type).map(handler => handler.handle(evt)))
      .then(() => {
        // Deliberately empty to satisfy return type.
      });
  }
}
