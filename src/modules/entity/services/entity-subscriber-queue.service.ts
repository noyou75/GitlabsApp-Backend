import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import Bull, { Queue } from 'bull';
import { AbstractQueueService } from '../../job/services/abstract-queue.service';
import { EntitySubscriberQueue } from '../queue/entity-subscriber.queue';

@Injectable()
export class EntitySubscriberQueueService extends AbstractQueueService {
  constructor(@InjectQueue(EntitySubscriberQueue.name) readonly queue: Queue) {
    super();
  }

  protected getQueue(): Bull.Queue<any> {
    return this.queue;
  }
}
