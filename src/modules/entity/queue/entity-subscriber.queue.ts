import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { Processor, ProcessorType } from '../../job/decorators/processor.decorator';
import { JobExecutionDescription } from '../../job/services/abstract-queue.service';
import { AbstractQueue } from '../../job/types/abstract.queue';
import { EntityLifecycleEventTypes, EntitySubscriberService } from '../services/entity-subscriber.service';

/**
 * Describes the basic contract for the entity subscriber data that will be passed into the entity subscriber job, and relayed to the handler indicated by this
 * object's 'handler' property.
 */
export interface EntitySubscriberJobData {
  /**
   * String containing the class name of the handler responding to a given job.
   */
  handler: string;

  /**
   * The entity lifecycle event initially triggering this job.
   */
  event: EntityLifecycleEventTypes;

  /**
   * The ID of the entity to which this lifecycle job applies.
   */
  entityId: string;

  /**
   * Name of the entity type for which this job applies.
   */
  entityType: string;
}

/**
 * Job processor for entity subscriber jobs.
 */
@Processor({
  name: EntitySubscriberQueue.name,
  type: ProcessorType.worker,
})
export class EntitySubscriberQueue extends AbstractQueue {
  @Inject()
  private readonly entitySubscriberService: EntitySubscriberService;

  @Process()
  public async process(job: Job<JobExecutionDescription<EntitySubscriberJobData>>) {
    const { data, ...jobParams } = job.data;

    /* Retrieve the handler metadata registered against the inbound handler */
    const handler = this.entitySubscriberService.getSubscriberEventHandler(data?.handler, true);

    /* If the above invocation did not return a handler, throw an exception. */
    if (!handler) {
      throw new Error(`Cannot process entity subscriber job - the supplied handler name did not map to an entity event handler.  Job +` +
        `data: ${ JSON.stringify(job.data) }`);
    }

    /* Dispatch a call to the handler */
    await handler(data.event, { newEntity: data.entityId }, { ...jobParams });
  }

  protected getQueueName(): string {
    return EntitySubscriberQueue.name;
  }
}
