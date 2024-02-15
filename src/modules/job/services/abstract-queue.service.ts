import { Job, JobOptions, Queue } from 'bull';
import { differenceInMilliseconds } from 'date-fns';
import { REQUEST_CONTEXT_IP_ADDRESS, RequestContext } from '../../../common/request-context';
import { SimpleTimeRange } from '../../shared/util/time.util';
import { DateTransformFn, RepeatType } from '../types/repeat-type';
import { CronSpecificationUtil, CronSpecificationParams } from '../utils/cron-specification.util';
import { extend } from 'lodash';

/**
 * Defines a job that may be repeated according to a certain specification.
 */
interface RepeatableJobSpecifications {
  strikeDate: Date;
}

/**
 * Repeat job that is specified using a cron specification
 */
export interface CronJobSpecifications extends RepeatableJobSpecifications {
  cron: CronSpecificationParams;
}

/**
 * Repeat job that is set using a series of dates.
 */
export interface RepeatJobSpecifications extends RepeatableJobSpecifications {
  dates: Date[] | undefined;
}

/**
 * Defines a base job description interface; job description types are generic, where the
 * generic type defines the job data payload.
 */
export interface JobDescription<T> {
  name?: string;
  data: T;
  domainDescriptorKey?: string;
  acceptableSchedulingHours?: SimpleTimeRange;
  [key: string]: any;
}

/**
 * Defines a base job description interface for repeatable jobs.
 */
export interface RepeatJobDescription<T> extends JobDescription<T> {
  strikeDate: Date;
  timezone: string;
  transformScheduledDate?: DateTransformFn;
}

/**
 * Defines an interface extending the basic job description that encompasses the full set of job execution parameters,
 * which holistically describe the circumstances under which we execute a job.
 */
export interface JobExecutionDescription<T> extends JobDescription<T> {
  ip: string;
}

/**
 * Abstract class for implementing queue management interface classes.  Derived classes will be directly responsible for managing
 * their associated queue.
 */
export abstract class AbstractQueueService {
  /**
   * Adds a new job to the managed queue with the supplied job description and job options.
   */
  async queueJob(jobDesc: JobDescription<any>, opts?: JobOptions) {
    const data = {
      ip: RequestContext.get(REQUEST_CONTEXT_IP_ADDRESS),
      ...jobDesc,
    };

    return jobDesc.name ? this.getQueue().add(jobDesc.name, data, opts) : this.getQueue().add(data, opts);
  }

  /**
   * Queues a repeatable job according to the supplied job description, options, and repeat type.
   */
  async queueRepeatJob(jobDesc: RepeatJobDescription<any>, repeatType = RepeatType.Asymptotic, opts?: JobOptions): Promise<Job[]> {
    /* Retrieve dates from the specified repeat type */
    const dates: Date[] = repeatType.getDates(
      jobDesc.strikeDate,
      jobDesc.timezone,
      jobDesc.acceptableSchedulingHours,
      jobDesc.transformScheduledDate,
    );

    const now = new Date();

    const jobPromises = dates.map(date => {
      return this.queueJob(
        jobDesc,
        extend(
          {
            delay: differenceInMilliseconds(date.getTime(), now.getTime()),
          },
          opts || {},
        ),
      );
    });

    return Promise.all(jobPromises);
  }

  /**
   * Adds a new repeatable job to the managed queue according to the supplied repeat specifications.  Consumers using this method may
   * specify a series of dates via repeatOptions.dates, as well as any overrides for specific con values via overrides (this last part
   * is optional); the supplied repeat objects will be translated into cron definitions / delayed jobs as appropriate.
   */
  async queueRepeatCronJob(data: object, repeatOptions: RepeatJobSpecifications | CronJobSpecifications, opts?: JobOptions) {
    /* Retrieve the cron spec that corresponds to the supplied parameters... */
    const cronSpec = CronSpecificationUtil.getCronSpec(
      (repeatOptions as RepeatJobSpecifications).dates,
      (repeatOptions as CronJobSpecifications).cron,
    );

    /* Add the repeat job to the queue */
    return this.getQueue().add(
      data,
      extend({}, opts, {
        repeat: {
          cron: cronSpec,
          endDate: repeatOptions.strikeDate,
        },
      }),
    );
  }

  /**
   * Retrieves a job from the managed queue with the supplied ID.
   */
  async getJob(jobId: string | number) {
    return this.getQueue().getJob(jobId);
  }

  on(event: string, callback: (...args: any[]) => void): this {
    this.getQueue().on(event, callback);
    return this;
  }

  /**
   * Retrieves the managed queue.
   */
  protected abstract getQueue(): Queue;
}
