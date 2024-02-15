import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PatientUser } from '../../../entities/user.entity';
import { StripeConfig } from '../enums/config.enum';
import { ConfigService } from './config.service';

@Injectable()
export class StripeService {
  protected client: Stripe;

  protected webhookSecret: string;

  protected defaultAccountProperties: Partial<Stripe.AccountCreateParams> = {
    business_type: 'individual',
    business_profile: {
      product_description: 'Phlebotomy Services',
      url: 'https://getlabs.com',
      mcc: '8099',
    },
    settings: {
      payouts: {
        schedule: {
          interval: 'weekly',
          weekly_anchor: 'tuesday',
          delay_days: 7,
        },
      },
    },

    // @ts-ignore (broken @types definition)
    requested_capabilities: ['transfers'],
  };

  constructor(private readonly configService: ConfigService) {
    this.client = new Stripe(configService.get(StripeConfig.ApiKey), {
      apiVersion: '2020-08-27',
      timeout: 30000,
    });

    this.webhookSecret = configService.get(StripeConfig.WebhookSecret);
  }

  getStripeClient() {
    return this.client;
  }

  createWebhookEvent(req: Request) {
    return this.client.webhooks.constructEvent(req.rawBody, req.header('Stripe-Signature'), this.webhookSecret);
  }

  createCustomer(user: PatientUser) {
    return this.client.customers.create({
      description: user.name,
      email: user.email,
      metadata: {
        id: user.id,
      },
    });
  }

  async retrieveCustomer(user: PatientUser) {
    return await this.client.customers.retrieve(user.paymentProfile.externalId);
  }

  async updateCustomer(user: PatientUser, data: any) {
    return await this.client.customers.update(user.paymentProfile.externalId, data);
  }

  createPaymentIntent(user: PatientUser, amount: number, metadata?: Stripe.MetadataParam) {
    return this.client.paymentIntents.create({
      amount,
      customer: user.paymentProfile.externalId || undefined,
      currency: 'USD',
      payment_method_types: ['card'],
      metadata,
    });
  }

  retrievePaymentIntent(id: string, options?: Stripe.PaymentIntentRetrieveParams) {
    return this.client.paymentIntents.retrieve(id, options ?? {});
  }

  updatePaymentIntent(id: string, data: Stripe.PaymentIntentUpdateParams) {
    return this.client.paymentIntents.update(id, data);
  }

  async refundPaymentIntent(id: string, reason: string) {
    return this.retrievePaymentIntent(id).then(pi => {
      const charge = pi.charges.data[0];

      if (!charge || charge.refunded) {
        return pi;
      } else {
        return this.client.refunds
          .create({
            charge: charge.id,
            reason: 'requested_by_customer',
            metadata: {
              reason,
            },
          })
          .then(() => this.retrievePaymentIntent(id));
      }
    });
  }

  createAccount(data: Partial<Stripe.AccountCreateParams>, ip: string) {
    return this.client.accounts.create({
      ...data,
      ...this.defaultAccountProperties,
      ...{
        type: 'custom',
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip,
        },
      },
    });
  }

  // updateAccount(id: string, data: Partial<Stripe.AccountUpdateParams>) {
  //   return this.client.accounts.update(id, {
  //     ...(data as Stripe.AccountUpdateParams),
  //     ...this.defaultAccountProperties,
  //   });
  // }



  retrieveAccount(id: string) {
    return this.client.accounts.retrieve(id);
  }

  retrieveBalance(id?: string) {
    return this.client.balance.retrieve(id ? { stripe_account: id } : undefined);
  }

  retrievePayouts(id?: string) {
    return this.client.payouts.list(id ? { stripe_account: id } : undefined);
  }
}
