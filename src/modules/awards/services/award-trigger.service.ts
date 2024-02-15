import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, SetMetadata, Type } from '@nestjs/common';
import { AwardTriggersEnum } from '../../../common/enums/award-triggers.enum';
import { EntityLifecycleEvent, EntityLifecycleEventHandler, EntityLifecycleEventTypes } from '../../entity/services/entity-subscriber.service';
import { LoggerService } from '../../core/services/logger.service';
import { AwardCampaignService } from './award-campaign.service';

export interface AwardTriggerHandler<E> {
  isTriggered(newEntity: E, oldEntity?: E): Promise<boolean>;
}

const AwardTriggerMetadataKey = 'AwardTriggerMetadataKey';

interface AwardTriggerMetadata<E> {
  entityType: Type<E>;
  entityEventTrigger: EntityLifecycleEventTypes;
  awardTrigger: AwardTriggersEnum;
}

export function AwardTrigger<E>(entityType: Type<E>, entityEventTrigger: EntityLifecycleEventTypes, awardTrigger: AwardTriggersEnum) {
  return (type: Type<AwardTriggerHandler<E>>) => {
    /* Configure the award trigger provider that will respond to the supplied aspects */
    SetMetadata<string, AwardTriggerMetadata<E>>(AwardTriggerMetadataKey, {
      entityType: entityType,
      entityEventTrigger: entityEventTrigger,
      awardTrigger,
    })(type);

    /* Create an entity lifecycle event handler from the AwardTriggerService - this service will delegate to the
     * provider configured above... */
    return EntityLifecycleEvent(entityType, entityEventTrigger)(AwardTriggerService);
  }
}

interface AwardTriggerHandlerDesc<E> {
  awardTrigger: AwardTriggersEnum;
  handler: AwardTriggerHandler<E>;
}

type EntityAwardTriggerHandlerGroup<E> = {
  [key in EntityLifecycleEventTypes]?: AwardTriggerHandlerDesc<E>[];
}

interface EntityAwardTriggerHandlerGroups {
  [key: string]: EntityAwardTriggerHandlerGroup<any>;
}

abstract class AwardTriggerError extends Error {

}

class AwardNotTriggeredError extends AwardTriggerError {
  constructor(public trigger: AwardTriggersEnum) {
    super(`The supplied award is not triggered.`);
  }
}

class NoCampaignError extends AwardTriggerError {
  constructor() {
    super(`No campaigns are mapped to the supplied trigger.`);
  }
}

@Injectable()
export class AwardTriggerService<T> implements OnModuleInit, EntityLifecycleEventHandler<T> {
  private readonly awardTriggerIndex: EntityAwardTriggerHandlerGroups = {};

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly awardCampaignService: AwardCampaignService,
    private readonly loggerService: LoggerService,
  ) { }

  onModuleInit(): any {
    this.discoveryService.providersWithMetaAtKey<AwardTriggerMetadata<any>>(AwardTriggerMetadataKey).then(providers => {
      providers.forEach(provider => {
        /* If no award trigger exists for this entity, create one now. */
        if (!this.awardTriggerIndex[provider.meta.entityType.name]) {
          this.awardTriggerIndex[provider.meta.entityType.name] = {};
        }

        /* If no collection exists for this particular event on this particular entity, create one now. */
        if (!this.awardTriggerIndex[provider.meta.entityType.name][provider.meta.entityEventTrigger]) {
          this.awardTriggerIndex[provider.meta.entityType.name][provider.meta.entityEventTrigger] = [];
        }

        /* Add the decorated class as a trigger handler against the indicated entity/trigger */
        this.awardTriggerIndex[provider.meta.entityType.name][provider.meta.entityEventTrigger].push({
            awardTrigger: provider.meta.awardTrigger,
            handler: provider.discoveredClass.instance as AwardTriggerHandler<any>,
        });
      })
    })
  }

  async handle(event: EntityLifecycleEventTypes, entityDetails: { newEntity: T, oldEntity?: T }) {
    /* Seek the appropriate trigger handler by starting at the current type, and working our way up the prototype tree until we find
     * the appropriate handler classes. */
    let handlers: EntityAwardTriggerHandlerGroup<T> = null;
    let proto = Object.getPrototypeOf(entityDetails.newEntity);

    while (!handlers && proto) {
      /* Check to see if there are any events mapped to the constructor name of the current prototype */
      handlers = this.awardTriggerIndex[proto.constructor.name];
      proto = Object.getPrototypeOf(proto);
    }

    /* Evaluate the resolved trigger handlers for the indicated type against the supplied event, if applicable. */
    handlers && handlers[event] && await Promise.all(handlers[event].map(handlerDesc => {
      /* If this particular trigger is applicable, we will invoke the award campaigns that are mapped to this trigger. */
      return handlerDesc.handler.isTriggered(entityDetails.newEntity, entityDetails.oldEntity)

        /* Retrieve the active campaigns for the supplied trigger */
        .then(isTriggered => {
          if (!isTriggered) {
            throw new AwardNotTriggeredError(handlerDesc.awardTrigger);
          }

          return this.awardCampaignService.getActiveCampaigns({ trigger: handlerDesc.awardTrigger });
        })

        /* Apply the award accordingly */
        .then(campaigns => {
          if (!campaigns?.data?.length) {
            throw new NoCampaignError();
          }

          return Promise.all(campaigns.data.map(campaign => this.awardCampaignService.applyAward(campaign, entityDetails.newEntity)))
        })

        /* Catch our exception scenarios and deal with them accordingly. */
        .catch(err => {
          /* If the error is an instance of AwardTriggerError, we will simply ignore the exception and carry on, as this is a normal condition caused
           * by a trigger simply not being invoked...  If it is not an instance of AwardTriggerError, that means we have a real exception that occurred
           * during this transaction, which must be respected. */
          if (!(err instanceof AwardTriggerError)) {
            throw err;
          }

          /* If we're specifically dealing with no campaigns mapped exception, we should log that appropriately. */
          if (err instanceof NoCampaignError) {
            this.loggerService.warn(`No campaigns mapped to trigger ${ handlerDesc.awardTrigger }. There may be an issue with ` +
              `how some campaigns are configured.`);
          }
        })
    }));
  }
}


