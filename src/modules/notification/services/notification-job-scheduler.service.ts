import { Injectable, Scope, Type } from '@nestjs/common';
import { isBefore, subDays } from 'date-fns';
import { format } from 'util';
import { User } from '../../../entities/user.entity';
import { RedisService } from '../../core/services/redis.service';
import {
  AbstractJobSchedulerService,
  JobSchedulingArguments,
  RepeatJobSchedulingArguments,
  TrackedJobDescription,
} from '../../job/services/abstract-job-scheduler.service';
import { DateTransformFn, RepeatType } from '../../job/types/repeat-type';
import { PatientContactHours, SimpleTimeRange } from '../../shared/util/time.util';
import { INotification, NotificationDescription } from '../notification';
import { NotificationJobDescription, NotificationQueueService, RepeatNotificationJobDescription } from './notification-queue.service';

/**
 * Retrieves the notification job key for the supplied notification and recipient.  If no notification is supplied,
 * this method will return a wildcard character in the notification's place in the resulting ID.
 */
const getNotificationJobIndexKey = (notificationType: Type<INotification>, recipient: User) => {
  return format(NotificationJobDescriptionImpl.NotificationKey, recipient.id, notificationType?.name || '*');
};

/**
 * Implements NotificationJobDescription to provide a functioning representation of a one-time notification job.  This type manages
 * the generation of notification keys through the implementation of TrackedJobDescription's getKey.
 */
class NotificationJobDescriptionImpl implements NotificationJobDescription, TrackedJobDescription<NotificationDescription> {
  // Notification jobs do not need name distinction
  public name: string = '';
  public recipient: User;
  public data: NotificationDescription;

  /**
   * Defines the template of the notification job index key; this part of the job index key will be inserted into its appropriate
   * place in the resulting job index key in AbstractJobScheduler.
   */
  static readonly NotificationKey = 'Notification:%s:%s';

  constructor(jobDesc: NotificationJobDescription, public domain: string, public namespace: string[]) {
    this.recipient = jobDesc.recipient;
    this.data = jobDesc.data;
  }

  public getKey() {
    return getNotificationJobIndexKey(Array.isArray(this.data) ? this.data[0].notification : this.data?.notification, this.recipient);
  }
}

/**
 * Implements RepeatNotificationJobDescription to provide a functioning representation of a repeatable notification job.  This type manages
 * the generation of notification keys through the implementation of TrackedJobDescription's getKey.
 */
class RepeatNotificationJobDescriptionImpl extends NotificationJobDescriptionImpl implements RepeatNotificationJobDescription {
  timezone: string;
  acceptableSchedulingHours: SimpleTimeRange = PatientContactHours;
  strikeDate: Date;

  /**
   * Notifications that are scheduled on the same day as the appointment are permitted to exist outside of configured acceptable
   * contact hours.
   */
  transformScheduledDate: DateTransformFn = date =>
    isBefore(subDays(this.strikeDate, 1), date) ? { date, isPermittedOutsideHours: true } : date;

  constructor(jobDesc: RepeatNotificationJobDescription, domain: string, namespace: string[]) {
    super(jobDesc, domain, namespace);
    this.timezone = jobDesc.recipient.timezone;
    this.strikeDate = jobDesc.strikeDate;
  }
}

/**
 * NotificationJobSchedulerService is the primary interface through which consumers will schedule notification jobs.  This
 * type extends AbstractJobSchedulerService, implementing support for notification jobs by managing job execution data.
 * When scheduling jobs through this service, consumers should use the appropriate interface of NotificationJobDescription.
 */
@Injectable({
  scope: Scope.TRANSIENT,
})
export class NotificationJobSchedulerService extends AbstractJobSchedulerService {
  private static readonly DefaultDomain = 'DefaultDomain';

  constructor(private notificationQueue: NotificationQueueService, redisService: RedisService) {
    super(notificationQueue, redisService);
  }

  /**
   * Retrieves the notification job execution arguments that pertain to the scheduling of repeat notification jobs.
   */
  public getRepeatJobArguments(
    jobDesc: RepeatNotificationJobDescription,
    namespace: string[],
    repeatType?: RepeatType,
  ): RepeatJobSchedulingArguments {
    const jobDescImpl = new RepeatNotificationJobDescriptionImpl(
      jobDesc,
      this.domain || NotificationJobSchedulerService.DefaultDomain,
      namespace,
    );

    return {
      jobDescription: jobDescImpl,
      repeatType,
    };
  }

  /**
   * Retrieves the notification job execution arguments that pertain to the scheduling of a single notification job.
   */
  public getJobArguments(jobDesc: NotificationJobDescription, namespace?: string[]): JobSchedulingArguments {
    const jobDescriptionImpl = new NotificationJobDescriptionImpl(
      jobDesc,
      this.domain || NotificationJobSchedulerService.DefaultDomain,
      namespace,
    );

    return {
      jobDescription: jobDescriptionImpl,
    };
  }

  /**
   * Retrieves a JobDescription object that describes the notification job(s) to cancel based on the supplied NotificationJobDescription.
   */
  public getCancelJobDescription(jobDesc: NotificationJobDescription, namespace: string[]): NotificationJobDescriptionImpl {
    return new NotificationJobDescriptionImpl(jobDesc, this.domain || NotificationJobSchedulerService.DefaultDomain, namespace);
  }
}
