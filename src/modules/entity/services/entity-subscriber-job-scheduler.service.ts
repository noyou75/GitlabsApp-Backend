import { Injectable, Type } from '@nestjs/common';
import { format } from 'util';
import { RedisService } from '../../core/services/redis.service';
import { AbstractJobSchedulerService, JobSchedulingArguments, RepeatJobSchedulingArguments, TrackedJobDescription } from '../../job/services/abstract-job-scheduler.service';
import { JobDescription, RepeatJobDescription } from '../../job/services/abstract-queue.service';
import { RepeatType } from '../../job/types/repeat-type';
import { EntitySubscriberJobData } from '../queue/entity-subscriber.queue';
import { EntitySubscriberQueueService } from './entity-subscriber-queue.service';
import { EntityLifecycleEventHandler, EntityLifecycleEventTypes } from './entity-subscriber.service';

/**
 * Describes the shape of entity subscriber job data that will be used to invoke entity subscriber jobs.
 */
export interface EntitySubscriberJobDescription<E> {
  /**
   * The entity instance upon which the supplied handler will operate.
   */
  entity: E;

  /**
   * The entity lifecycle handler that will perform operations on the supplied entity.
   */
  handler: Type<EntityLifecycleEventHandler<E>>;

  /**
   * The lifecycle event that triggers this job.
   */
  event: EntityLifecycleEventTypes;
}

/**
 * An internal class that serves as a means to transform structured EntitySubscriberJobDescription data into ODS-friendly TrackedJobDescription objects, and to standardize
 * keys assigned to jobs.
 */
class EntitySubscriberJobDescriptionImpl<E extends { id: string }> implements TrackedJobDescription<EntitySubscriberJobData> {
  public data: EntitySubscriberJobData;

  constructor(jobDescOrData: EntitySubscriberJobDescription<E> | EntitySubscriberJobData) {
    /* Transform the inbound job description into a format that's safe to store in redis. */
    this.data = this._isEntitySubscriberJobData(jobDescOrData) ? jobDescOrData : {
      entityId: jobDescOrData.entity.id,
      event: jobDescOrData.event,
      handler: jobDescOrData.handler.name,
      entityType: Object.getPrototypeOf(jobDescOrData.entity).constructor.name
    };
  }

  getKey() {
    /* Jobs for EntitySubscriber are keyed as 'EntitySubscriber:[EntityTypeName]:[EntityId] */
    return format(
      'EntitySubscriber:%s:%s',
      this.data.entityType,
      this.data.entityId,
    );
  }

  private _isEntitySubscriberJobData(val: EntitySubscriberJobDescription<E> | EntitySubscriberJobData): val is EntitySubscriberJobData {
    return typeof val.handler === 'string';
  }
}

class EntitySubscriberRepeatJobDescription<E extends { id: string }>
  extends EntitySubscriberJobDescriptionImpl<E>
  implements RepeatJobDescription<EntitySubscriberJobData> {
  public timezone: string;
  public strikeDate: Date;

  constructor(jobDesc: RepeatJobDescription<EntitySubscriberJobDescription<E>>) {
    super(jobDesc.data);
    this.timezone = jobDesc.timezone;
    this.strikeDate = jobDesc.strikeDate;
  }
}

@Injectable()
export class EntitySubscriberJobSchedulerService<E extends { id: string }> extends AbstractJobSchedulerService {
  constructor(queue: EntitySubscriberQueueService, redisService: RedisService) {
    super(queue, redisService);
  }

  protected getCancelJobDescription(jobDesc: JobDescription<EntitySubscriberJobData>, namespace: string[]): TrackedJobDescription<any> {
    return new EntitySubscriberJobDescriptionImpl(jobDesc.data);
  }

  protected getJobArguments(jobDesc: JobDescription<EntitySubscriberJobDescription<E>>, namespace?: string[]): JobSchedulingArguments {
    return {
      jobDescription: new EntitySubscriberJobDescriptionImpl(jobDesc.data)
    }
  }

  protected getRepeatJobArguments(jobDesc: RepeatJobDescription<EntitySubscriberJobDescription<E>>, namespace: string[], repeatType?: RepeatType): RepeatJobSchedulingArguments {
    return {
      jobDescription: new EntitySubscriberRepeatJobDescription(jobDesc),
      repeatType,
    };
  }
}
