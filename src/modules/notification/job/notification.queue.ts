import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { Process } from '@nestjs/bull';
import { JobDescription } from '../../job/services/abstract-queue.service';
import { AbstractQueue } from '../../job/types/abstract.queue';
import { JobUserDescriptor } from '../../user/job/JobUserDescriptor';
import { UserFactory } from '../../user/user.factory';
import { UserService } from '../../user/user.service';
import { NotificationTypeService } from '../services/notification-type.service';
import { NotificationService } from '../services/notification.service';
import { Processor, ProcessorType } from '../../job/decorators/processor.decorator';

/**
 * Defines a notification as it will be expressed in job execution (how it will be represented in Redis).
 */
interface JobNotificationDescriptor {
  notification: string;
  params: object;
  recipient: JobUserDescriptor;
}

/**
 * Subclass of AbstractQueue - represents the implementation of the notifications queue.  This queue is
 * simple - when a job is fired, it is handled by the processNotifications processor, which dispatches
 * the target notification to the target user.
 */
@Processor({ name: NotificationQueue.QueueName, type: ProcessorType.worker })
export class NotificationQueue extends AbstractQueue {
  @Inject()
  notificationService: NotificationService;

  @Inject()
  notificationType: NotificationTypeService;

  @Inject()
  userService: UserService;

  public static QueueName = 'notifications';

  @Process()
  async processNotification(job: Job<JobDescription<JobNotificationDescriptor>>) {
    this.logJobStep(job, 'Begin processor - default#processNotification');

    /* Resolve the user that is the target of this notification, as well as the notification type */
    const user = await this.userService.findOne(UserFactory.getClassType(job.data.data.recipient.type), job.data.data.recipient.id);
    const type = this.notificationType.getType(job.data.data.notification);

    /* Dispatch the notification */
    await this.notificationService.send(type, user, job.data.data.params);

    this.logJobStep(job, 'End processor - default#processNotification');
  }

  protected getQueueName(): string {
    return NotificationQueue.QueueName;
  }
}
