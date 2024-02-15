import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { JobModule } from '../job/job.module';
import { JobEntityLifecycleHandlerStrategy } from './handler-strategies/job-entity-lifecycle-handler.strategy';
import { EntitySubscriberQueue } from './queue/entity-subscriber.queue';
import { EntitySubscriberJobSchedulerService } from './services/entity-subscriber-job-scheduler.service';
import { EntitySubscriberQueueService } from './services/entity-subscriber-queue.service';
import { EntitySubscriberService } from './services/entity-subscriber.service';

@Module({
  imports: [
    JobModule,
    BullModule.registerQueue({
      name: EntitySubscriberQueue.name,
    }),
  ],
  providers: [
    EntitySubscriberService,
    EntitySubscriberJobSchedulerService,
    EntitySubscriberQueueService,
    EntitySubscriberQueue,

    JobEntityLifecycleHandlerStrategy,
  ],

  exports: [
    EntitySubscriberJobSchedulerService,
    EntitySubscriberService,
  ]
})
export class EntityModule {

}
