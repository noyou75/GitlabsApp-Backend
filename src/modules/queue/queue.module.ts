import { PubSub } from '@google-cloud/pubsub';
import { Module } from '@nestjs/common';
import { PUB_QUEUE_CLIENT } from '../../common/constants';
import { CoreModule } from '../core/core.module';
import { PubQueueService } from './pub-queue.service';

@Module({
  imports: [CoreModule],
  providers: [
    PubQueueService,
    {
      provide: PUB_QUEUE_CLIENT,
      useFactory: () => {
        return new PubSub();
      },
    },
  ],
  exports: [PubQueueService],
})
export class QueueModule {}
