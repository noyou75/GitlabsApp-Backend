import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, SetMetadata, Type } from '@nestjs/common';
import { castArray } from 'lodash';
import Stripe from 'stripe';

export enum WebhookType {
  Stripe = 'Stripe',
}

export interface WebhookHandler<T> {
  handle(event: T): Promise<void>;
}

interface WebhookHandlerMetadata {
  webhookType: WebhookType;
  events: string[],
}

const WebhookMetadataKey = 'WebhookMetadataKey';

export function Webhook<T>(webhookType: WebhookType, event: string | string[]) {
  /* Retrieve a registration function that we will use to register the decorated class with the metadata key/value indicating the
   * type of webhook processor. */
  const reg = SetMetadata(WebhookMetadataKey, { webhookType: webhookType, events: castArray(event) });
  return (type: Type<WebhookHandler<T>>) => reg(type);
}

export function StripeWebhook(event: string | string[]) {
  return Webhook<Stripe.Event>(WebhookType.Stripe, event);
}

@Injectable()
export class WebhookHandlerService implements OnModuleInit {
  constructor(private readonly discoveryService: DiscoveryService) { }

  private readonly webhookHandlers: { [key in WebhookType]?: { events: string[], handler: WebhookHandler<any> }[] } = {};

  onModuleInit(): any {
    return this.discoveryService.providersWithMetaAtKey<WebhookHandlerMetadata>(WebhookMetadataKey).then(webhookHandlerMetas => {
      webhookHandlerMetas.forEach(webhookHandlerMeta => {
        /* If no handler description for the current webhook type exists, create one now. */
        if (!this.webhookHandlers[webhookHandlerMeta.meta.webhookType]) {
          this.webhookHandlers[webhookHandlerMeta.meta.webhookType] = [];
        }

        /* Add the supplied definition to the webhook handlers set for the described webhook type */
        this.webhookHandlers[webhookHandlerMeta.meta.webhookType].push({
          events: webhookHandlerMeta.meta.events,
          handler: webhookHandlerMeta.discoveredClass.instance as WebhookHandler<any>,
        });
      });
    });
  }

  getHandlers<T>(type: WebhookType, event: string): WebhookHandler<T>[] {
    return this.webhookHandlers[type] ? this.webhookHandlers[type].reduce((accumulator: WebhookHandler<any>[], webhookHandler) => {
      /* Search for the requested event in this handler description's events set.  If we find a match, add it to the result array. */
      if (webhookHandler.events.some(handledEvent => handledEvent.toUpperCase() === event.toUpperCase())) {
        accumulator.push(webhookHandler.handler);
      }

      return accumulator;
    }, []) : [];
  }
}
