import { Type } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, EntityManager, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { TransactionCommitEvent } from 'typeorm/subscriber/event/TransactionCommitEvent';
import { EntityLifecycleEventExecutionTiming, EntityLifecycleEventTypes, EntitySubscriberService } from '../services/entity-subscriber.service';

/**
 * Internal interface that describes a possibly deferred transaction-scope operation for a given entity, stored
 * against a given transactional entity manager.
 */
interface EntityManagerTransactionMetadata<T> {
  event: EntityLifecycleEventTypes;
  newEntity: T;
  oldEntity: T;
}

/**
 * Internal interface that contains all of the possibly deferred transaction-scope transactions for all
 * involved entities, stored against a given transactional entity manager. This is necessary as a given
 * transactional entity manager is shared across all entities for the duration of a transaction, within
 * the scope of the transaction.
 */
interface EntityManagerTransactionMetadataSet {
  [key: string]: EntityManagerTransactionMetadata<any>[];
}

export function EntitySubscriber<E>(type: Type<E>) {
  abstract class EntitySub implements EntitySubscriberInterface<E> {
    private readonly EntityManagerTransactionMetadataKey = 'EntityManagerTransactionMetadataKey';

    constructor(
      @InjectConnection() readonly connection: Connection,
      private readonly entitySubscriberService: EntitySubscriberService,
    ) {
      // Manually register subscriber with connection
      // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
      connection.subscribers.push(this);
    }

    listenTo() {
      return type;
    }

    async beforeInsert(event: InsertEvent<E>) {
      await this.doAction(EntityLifecycleEventTypes.Created, event.manager, 'before', event.entity);
    }

    async afterInsert(event: InsertEvent<E>) {
      this.stageCommitDeferral(EntityLifecycleEventTypes.Created, event);

      await this.doAction(EntityLifecycleEventTypes.Created, event.manager, 'after', event.entity);
    }

    beforeUpdate(event: UpdateEvent<E>): Promise<any> | void {
      return this.doAction(EntityLifecycleEventTypes.Updated, event.manager, 'before', event.entity as E, event.databaseEntity);
    }

    afterUpdate(event: UpdateEvent<E>): Promise<any> | void {
      this.stageCommitDeferral(EntityLifecycleEventTypes.Updated, event);

      return this.doAction(EntityLifecycleEventTypes.Updated, event.manager, 'after', event.entity as E, event.databaseEntity);
    }

    beforeTransactionCommit(event: TransactionCommitEvent): Promise<any> | void {
      /* Perform the commit actions that may be staged for the corresponding entity manager */
      this.doCommitAction(event.manager, 'beforeTransactionCommit');
    }

    afterTransactionCommit(event: TransactionCommitEvent): Promise<any> | void {
      /* Perform the commit actions that may be staged for the corresponding entity manager */
      this.doCommitAction(event.manager, 'afterTransactionCommit');
    }

    beforeRemove(event: RemoveEvent<E>): Promise<any> | void {
      return this.doAction(EntityLifecycleEventTypes.Deleted, event.manager, 'before', event.entity);
    }

    afterRemove(event: RemoveEvent<E>): Promise<any> | void {
      this.stageCommitDeferral(EntityLifecycleEventTypes.Deleted, event);

      return this.doAction(EntityLifecycleEventTypes.Deleted, event.manager, 'after', event.entity);
    }

    private doCommitAction(
      entityManager: EntityManager,
      lifecycleSegment: EntityLifecycleEventExecutionTiming,
    ) {
      const metadatas: EntityManagerTransactionMetadataSet = Reflect.getMetadata(this.EntityManagerTransactionMetadataKey, entityManager);

      /* Invoke doAction with the execution timing hook of beforeTransactionCommit */
      metadatas && metadatas[type.name] && metadatas[type.name].forEach(metadata => this.doAction(
        metadata.event,
        lifecycleSegment === 'beforeTransactionCommit' ? entityManager : null,
        lifecycleSegment,
        metadata.newEntity,
        metadata.oldEntity,
      ));
    }

    /**
     * Stages the supplied entity lifecycle event to potentially take place during the commit phase of this transaction.  During the commit phase,
     * the subscriber logic will query the entity subscriber service to determine if any lifecycle event handlers are meant to be performed
     * for the supplied lifecycle event before/after transaction commit.
     */
    private stageCommitDeferral(lifecycleEvent: EntityLifecycleEventTypes, entityEvent: InsertEvent<E> | RemoveEvent<E> | UpdateEvent<E>) {
      /* Retrieve the currently-defined transaction metadata corresponding to this event, if applicable. */
      const metadatas: EntityManagerTransactionMetadataSet = Reflect.getMetadata(this.EntityManagerTransactionMetadataKey, entityEvent.manager) || {};

      /* If no transaction metadata set exists for the entity tied to this subscriber, create one now. */
      if (!metadatas[type.name]) {
        metadatas[type.name] = [];
      }

      /* Tag the inbound entity manager with metadata describing the event, in case we need to refer to this event in the
       * transaction listener. */
      metadatas[type.name].push({
        event: lifecycleEvent,
        newEntity: entityEvent.entity,
        oldEntity: (entityEvent as UpdateEvent<E>).databaseEntity,
      });

      Reflect.defineMetadata(this.EntityManagerTransactionMetadataKey, metadatas, entityEvent.manager);
    }

    private async doAction(
      event: EntityLifecycleEventTypes,
      entityManager: EntityManager,
      lifecycleSegment: EntityLifecycleEventExecutionTiming,
      newEntity: E,
      oldEntity?: E,
    ) {
      /* Retrieve the handlers that are appropriate for this event/entity */
      const ops = this.entitySubscriberService.getSubscriberEventHandlers(type, event, lifecycleSegment)
        .map(handler => {
          /* Execute each identified handler. */
          return handler(event, { newEntity, entityManager, oldEntity });
        });

      await Promise.all(ops);
    }
  }

  return EntitySub;
}

