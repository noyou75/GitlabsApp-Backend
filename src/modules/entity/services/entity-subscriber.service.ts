import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, SetMetadata, Type } from '@nestjs/common';
import { EntityManager, getRepository } from 'typeorm';

/**
 * Describes the various lifecycle events that a given entity may undergo.
 */
export enum EntityLifecycleEventTypes {
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
}

/**
 * The basic object shape for handler classes annotated with @EntityLifecycleEvent
 */
export interface EntityLifecycleEventHandler<E> {
  /**
   * Performs the entity lifecycle event mapped to this class through its decorator call.
   */
  handle: EntityLifecycleEventHandlerFunction<E>;
}

/**
 * Describes at what point of the database insertion process the handler should be executed.
 *
 * before indicates before the row is inserted.
 *
 * after indicates after the row is inserted.
 */
export type EntityLifecycleEventExecutionTiming = 'before' | 'after' | 'beforeTransactionCommit' | 'afterTransactionCommit';

/**
 * Options that change the behaviour of how a given handler is executed.
 */
export interface EntityLifecycleEventOptions {
  /**
   * Determines if the decorated class' action should occur before or after the DB operation.  Default = before.
   */
  executeOn?: EntityLifecycleEventExecutionTiming;

  /**
   * Determines if the lifecycle handler will be run in-band with the lifecycle event, or out-of-band as a job.
   * Default = false.
   */
  runAsJob?: boolean;
}

/**
 * Decorates a class as a an entity lifecycle event handler.  The decorated class' 'handle' method will be invoked when the supplied event occurs on the supplied entity type.
 */
export function EntityLifecycleEvent<E>(
  entity: Type<E>,
  event: EntityLifecycleEventTypes,
  options?: EntityLifecycleEventOptions,
) {
  return (type: Type<EntityLifecycleEventHandler<E>>) => {
    SetMetadata<string, EntityLifecycleEventMetadata<E>>(
      EntityLifecycleEventMetadataKey, {
        entity,
        event,
        options,
      })(type);
  }
}

/**
 * Internal structure that's used to describe the execution conditions of a given entity lifecycle handler provider.
 */
interface EntityLifecycleEventMetadata<E> {
  entity: Type<E>;
  event: EntityLifecycleEventTypes;
  options?: EntityLifecycleEventOptions;
}

const EntityLifecycleEventMetadataKey = 'EntityLifecycleEventMetadataKey';

/**
 * Standard execution function that performs configured logic responding to a given entity lifecycle event.
 */
export type EntityLifecycleEventHandlerFunction<E> = (
  event: EntityLifecycleEventTypes,
  entityData: {
    newEntity: E,
    oldEntity?: E,
    entityManager?: EntityManager,
  },
  eventContext?: { [key: string]: any }
) => Promise<void>;

/**
 * An extension of EntityLifecycleEventHandlerFunction that adds string as an acceptable parameter for entity.  If string is provided, a proxy on this function will automatically
 * handle retrieving the related entity for the entity type described in the linked handler metadata.
 */
export type EntityResolvableLifecycleEventHandlerFunction<E> = EntityLifecycleEventHandlerFunction<string | E>;

/**
 * Interface type that is implemented by lifecycle event handler execution strategies.  These strategies determine how the actual handler's logic will be invoked (ex. in-band
 * or out-of-band).
 */
export interface IEntityLifecycleHandlerStrategy {
  /**
   * Prepares the handler (described in the delegate parameter) for execution.
   */
  stageHandler(delegate: EntityLifecycleEventHandler<any>): EntityLifecycleEventHandlerFunction<any>;

  /**
   * Identifies whether or not this strategy should apply for the given set of handler options.
   */
  identify(options: EntityLifecycleEventOptions): boolean;
}

const EntityLifecycleHandlerStrategyMetadataKey = 'EntityLifecycleHandlerStrategyMetadataKey';

/**
 * Decorator that is used to annotate entity lifecycle handler strategies; we use this decorator to simply make the entity subscriber system aware of the execution strategy's
 * presence.
 */
export function EntityLifecycleHandlerStrategy() {
  return (type: Type<IEntityLifecycleHandlerStrategy>) => {
    SetMetadata(EntityLifecycleHandlerStrategyMetadataKey, EntityLifecycleHandlerStrategyMetadataKey)(type);
  }
}

/**
 * The default entity lifecycle handler strategy that is invoked in all cases where a given handler does not map to a specific strategy.  This strategy invokes the handler's
 * logic in-band and immediately.
 */
class DefaultEntityLifecycleHandlerStrategy implements IEntityLifecycleHandlerStrategy {
  stageHandler(delegate: EntityLifecycleEventHandler<any>): EntityLifecycleEventHandlerFunction<any> {
    return (event, entityData, eventContext) => delegate.handle(event, entityData, eventContext);
  }

  identify() {
    // Always returns true - used as a last resort
    return true;
  }
}

interface HandlerDescription<T> {
  handler: EntityLifecycleEventHandler<any>,
  options: EntityLifecycleEventOptions,
  entity: Type<T>
}

/**
 * Service that handles administrative tasks associated with identifying/formatting event handlers and execution strategies.
 * Consumers may use this service to retrieve invocable functions that holistically fire handlers (i.e. resolves the
 * appropriate execution strategy, and stages the handler to be executed through said strategy).
 */
@Injectable()
export class EntitySubscriberService implements OnModuleInit {
  private evtHandlerDefs: {
    /* First level of organization is the entity's name. */
    [key: string]: {
      /* Second level of organization is the entity lifecycle event. */
      [key in EntityLifecycleEventTypes]?: HandlerDescription<any>[]
    }
  } = {};

  private strategies: IEntityLifecycleHandlerStrategy[];

  constructor(
    private readonly discoveryService: DiscoveryService,
  ) {
  }

  async onModuleInit() {
    /* Retrieve all registered event lifecycle handlers for the supplied type. */
    await this.discoveryService.providersWithMetaAtKey<EntityLifecycleEventMetadata<any>>(EntityLifecycleEventMetadataKey)
      .then(providers => {
        /* Collect all relevant providers that are assigned the EntityLifecycleEventMetadataKey, and take their injected instances
         * so they an be queried by consumers */
        return providers.forEach(provider => {
          /* If a lifecycle event for the handler entity doesn't yet exist, create it now. */
          if (!this.evtHandlerDefs[provider.meta.entity.name]) {
            this.evtHandlerDefs[provider.meta.entity.name] = {};
          }

          /* If a lifecycle event handler group doesn't yet exist for the specified event, create one now. */
          if (!this.evtHandlerDefs[provider.meta.entity.name][provider.meta.event]) {
            this.evtHandlerDefs[provider.meta.entity.name][provider.meta.event] = [];
          }

          /* Add the specified provider as a handler for the specified event on the specified entity. */
          this.evtHandlerDefs[provider.meta.entity.name][provider.meta.event].push(
            {
              handler: provider.discoveredClass.instance as EntityLifecycleEventHandler<any>,
              options: {
                executeOn: 'before',
                ...provider.meta.options
              },
              entity: provider.meta.entity,
            }
          );
        }, {});
      });

    /* Retrieve the various registered lifecycle handler strategies. */
    this.strategies = await this.discoveryService.providersWithMetaAtKey(EntityLifecycleHandlerStrategyMetadataKey)
      .then(discoveredStrategies => discoveredStrategies
        .map(discoveredStrategy => discoveredStrategy.discoveredClass.instance as IEntityLifecycleHandlerStrategy));
  }

  getSubscriberEventHandlers<T>(
    entity: Type<T>,
    event: EntityLifecycleEventTypes,
    lifecycleSegment: EntityLifecycleEventExecutionTiming,
    skipStrategyResolution?: boolean
  ): Array<EntityResolvableLifecycleEventHandlerFunction<T>> {
    /* Find all subscribers for the supplied entity type mapping to the supplied event, which should be executed on the supplied lifecycle
     * timing... */
    /* Step 1 & 2 - filter by entity and event type */
    return (this.evtHandlerDefs[entity.name] && this.evtHandlerDefs[entity.name][event] &&
      this.evtHandlerDefs[entity.name][event].reduce((collector: Array<EntityResolvableLifecycleEventHandlerFunction<T>>, entityHandlerDesc) => {
        /* Step 3 - filter by execution lifecycle timing. */
        if (entityHandlerDesc.options.executeOn === lifecycleSegment) {
          /* Step 4 - retrieve a strategy that is appropriate for this handler. */
          collector.push(this._stageHandler(entityHandlerDesc, skipStrategyResolution));
        }

        return collector;
    }, [])) || [];
  }

  getSubscriberEventHandler<E>(handlerName: string, skipStrategyResolution?: boolean): EntityResolvableLifecycleEventHandlerFunction<E> {
    /* Search all of the entities' handlers until we find a handler that has the corresponding string... */
    let resultDesc: HandlerDescription<E>;

    Object.values(this.evtHandlerDefs).find(entityEventHandlerDefs => {
      return !!Object.values(entityEventHandlerDefs).find(eventHandlerDescs => {
        return eventHandlerDescs.find(eventHandlerDesc => {
          /* Compare the handler's name against the supplied name. */
          resultDesc = Object.getPrototypeOf(eventHandlerDesc.handler).constructor.name === handlerName ? eventHandlerDesc : null;
          return !!resultDesc;
        });
      });
    });

    /* Retrieve the appropriate strategy for the resulting handler, if applicable... */
    return resultDesc && this._stageHandler(resultDesc, skipStrategyResolution);
  }

  private _getStrategy<T>(handlerDesc: HandlerDescription<T>, skipStrategyResolution = false) {
    /* Retrieve the strategy corresponding to the supplied handler desc / entity */
    return (!skipStrategyResolution && this.strategies.find(strategy => strategy.identify(handlerDesc.options))) ||
      new DefaultEntityLifecycleHandlerStrategy();
  }

  private _stageHandler<T>(handlerDesc: HandlerDescription<T>, skipStrategyResolution = false): EntityResolvableLifecycleEventHandlerFunction<T> {
    /* Retrieve the strategy according to the supplied parameters. */
    const handlerFunction: EntityLifecycleEventHandlerFunction<T> = this._getStrategy(
      handlerDesc,
      skipStrategyResolution
    ).stageHandler(handlerDesc.handler);

    /* Read the handlerDesc to insert a surrogate function that can accept a string or an entity. */
    return async (event, { newEntity, oldEntity, entityManager }, eventContext) => {
      /* If newEntity is a string, we will need to resolve the object related described by this string. */
      return handlerFunction(
        event,
        {
          newEntity: typeof newEntity === 'string' ? await getRepository(handlerDesc.entity).findOneOrFail(newEntity) : newEntity,
          oldEntity: typeof newEntity !== 'string' && typeof oldEntity !== 'string' ? oldEntity : null,
          entityManager
        },
        eventContext,
      );
    }
  }
}
