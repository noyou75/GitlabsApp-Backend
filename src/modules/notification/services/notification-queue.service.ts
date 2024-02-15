import { Injectable } from '@nestjs/common';
import { JobOptions, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { className } from '../../../common/class.utils';
import { User } from '../../../entities/user.entity';
import { AbstractQueueService, JobDescription, RepeatJobDescription } from '../../job/services/abstract-queue.service';
import { NotificationQueue } from '../job/notification.queue';
import { NotificationDescription } from '../notification';

/**
 * Defines the job description interface that is used to describe single-execution notification jobs by consuming
 * components (i.e. before the job is passed to the execution tier).
 */
export interface NotificationJobDescription extends JobDescription<NotificationDescription> {
  recipient: User;
}

/**
 * Defines the job description interface that is used to describe repeatable notification jobs by consuming
 * components (i.e. before the job is passed to the execution tier).
 */
export interface RepeatNotificationJobDescription extends NotificationJobDescription, RepeatJobDescription<NotificationDescription> {}

/**
 * Implementation of AbstractQueueService that is responsible for managing the notifications queue.  This service
 * should be used to schedule notifications that occur out-of-band (i.e. not attached to any particular action).
 */
@Injectable()
export class NotificationQueueService extends AbstractQueueService {
  constructor(@InjectQueue(NotificationQueue.QueueName) readonly queue: Queue) {
    super();
  }

  /**
   * Queues the supplied notification to be sent at the specified date/time.
   */
  async queueJob(jobDesc: NotificationJobDescription, opts?: JobOptions) {
    const notificationDesc = Array.isArray(jobDesc.data) ? jobDesc.data[0] : jobDesc.data;

    return await super.queueJob(
      {
        /* Some transformation is necessary to make these values job-friendly */
        ...jobDesc,
        data: {
          ...notificationDesc,
          notification: notificationDesc.notification.name,
          recipient: {
            id: jobDesc.recipient.id,
            type: className(jobDesc.recipient),
          },
        },
      },
      opts,
    );
  }

  protected getQueue(): Queue<any> {
    return this.queue;
  }
}
