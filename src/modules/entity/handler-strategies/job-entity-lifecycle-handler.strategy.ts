import { Injectable } from '@nestjs/common';
import { EntitySubscriberJobSchedulerService } from '../services/entity-subscriber-job-scheduler.service';
import {
  EntityLifecycleEventHandler,
  EntityLifecycleEventHandlerFunction,
  EntityLifecycleEventOptions,
  EntityLifecycleHandlerStrategy,
  IEntityLifecycleHandlerStrategy
} from '../services/entity-subscriber.service';


/**
 * A lifecycle handler execution strategy that schedules the lifecycle event to be executed as a job.  A given lifecycle handler will use this execution strategy if the
 * runAsJob option is set to true.
 */
@EntityLifecycleHandlerStrategy()
@Injectable()
export class JobEntityLifecycleHandlerStrategy implements IEntityLifecycleHandlerStrategy {
  constructor(private readonly entitySubscriberJobSchedulerService: EntitySubscriberJobSchedulerService<any>) {

  }

  stageHandler(delegate: EntityLifecycleEventHandler<any>): EntityLifecycleEventHandlerFunction<any> {
    /* Schedule a job that executes the supplied delegate. */
    return (event, entityData) => this.entitySubscriberJobSchedulerService.scheduleJob({
      data: {
        entity: entityData.newEntity,
        handler: Object.getPrototypeOf(delegate).constructor,
        event
      }
    });
  }

  identify(options: EntityLifecycleEventOptions) {
    /* Returns true if runAsJob in the event options is true. */
    return !!options?.runAsJob;
  }
}
