import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { StripeWebhookService } from './services/stripe-webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly stripe: StripeWebhookService) {}

  @Post('stripe')
  @HttpCode(200)
  async createFromKey(@Req() req: Request): Promise<any> {
    return await this.stripe.handleWebhook(req);
  }
}
