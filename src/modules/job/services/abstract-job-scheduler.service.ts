import { Inject } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import { differenceInMilliseconds } from 'date-fns';
import { Redis } from 'ioredis';
import { format } from 'util';
import { extend } from 'lodash';
import { LoggerService } from '../../core/services/logger.service';
import { RedisService } from '../../core/services/redis.service';
import { JobDomainManager } from '../decorators/job-domain.decorator';
import { RepeatType } from '../types/repeat-type';
import { getCompliantDates } from '../utils/scheduling.utils';
import { AbstractQueueService, JobDescription, RepeatJobDescription } from './abstract-queue.service';

/**
 * Defines the contract of methods that query the redis DB for job index IDs.
 */
type QueryFunction = (key: string) => Promise<string[]>;

/**
 * All methods that perform redis queries for retrieving job index IDs are defined in a QueryModes object.
 */
interface QueryModes {
  [key: string]: QueryFunction;
}

/**
 * Extending interface of JobDescription that provides handles for tracking jobs.
 */
export interface TrackedJobDescription<T> extends JobDescription<T> {
  getKey: () => string;
  namespace?: string[];
}

/**
 * Extending interface of TrackedJobDescription / RepeatJobDescription; provides handles for tracking jobs in the
 * context of repeatable jobs.
 */
export interface TrackedScheduledJobDescription<T> extends RepeatJobDescription<T>, TrackedJobDescription<T> {}

/**
 * Interface that defines a job scheduler service, which at a minimum contains setDomain.
 */
export interface IJobSchedulerService {
  setDomainDescriptorKey(domain: string);
}

/**
 * Interface that defines the full set of arguments that are used to schedule jobs, including the job description
 * object, the options to apply to job execution, and the execution date of the job.
 */
export interface JobSchedulingArguments {
  jobDescription: TrackedJobDescription<any>;
  jobOptions?: JobOptions;
  executeDate?: Date;
}

/**
 * Interface that defines the full set of arguments that are used to schedule repeatable jobs, including the job
 * description object, the the job options, and the repeat type.
 */
export interface RepeatJobSchedulingArguments extends JobSchedulingArguments {
  jobDescription: TrackedScheduledJobDescription<any>;
  repeatType: RepeatType;
}

/**
 * Base class for scheduling jobs; subclasses should serve as the primary interface through which consuming
 * business logic will schedule jobs.  This base implementation provides the vast majority of job
 * scheduling functionality out of the box; consuming components need only provide their job execution
 * parameters.
 */
export abstract class AbstractJobSchedulerService implements IJobSchedulerService {
  /**
   * All jobs index keys will be tracked using the below format.  The format is described as:
   * GlJobIndex:[Domain]:[Namespace]:[jobKey]
   */
  private static readonly JobIndexKeyFormat = 'GlJobIndex:%s:%s:%s';

  /**
   * Default domain is used if the consumer does not provide a domain.
   */
  private static readonly DefaultJobDomain = 'DefaultJobDomain';

  /**
   * Default namespace is used if the consumer does not provide a namespace.
   */
  private static readonly DefaultNamespace = 'DefaultNamespace';

  private _domainDescriptorKey: string;

  protected readonly redis: Redis;

  protected constructor(protected queue: AbstractQueueService, redisService: RedisService) {
    this.redis = redisService.getClient();
    this.setupQueueListeners();
  }

  @Inject()
  protected readonly loggerService: LoggerService;

  protected readonly NotificationKeyQueryModes: QueryModes = {
    /**
     * 'set' query mode is used to query 'set' types in redis (i.e. added through sadd-family commands).
     */
    set: async (key) => (await this.redis.smembers(key)) as Array<string>,

    /**
     * 'string' query mode is used to query any normal key/value pair in redis. (i.e. added through set command).
     */
    string: async (key) => {
      const r = await this.redis.get(key);
      return typeof r === 'string' ? [r] : [];
    },
  };

  protected async removeRedisKeyForJob(job: Job): Promise<void> {
    const key = this.getJobIndexKey(this.getCancelJobDescription(job.data, job.data.namespace));
    const queuedJobs = await this._getJobs(key);

    // Only one job with this key and it is this one, delete the key
    if (queuedJobs.length === 1 && queuedJobs[0].id === job.id) {
      await this.redis.del(key);
    } else {
      // If job is set for key remove it
      for (const queuedJob of queuedJobs) {
        if (queuedJob.id === job.id) {
          await this.redis.srem(key, job.id);
        }
      }
    }
  }

  protected setupQueueListeners(): void {
    this.queue
      .on('completed', async (job: Job) => {
        await this.removeRedisKeyForJob(job);
      })
      .on('removed', async (job: Job) => {
        await this.removeRedisKeyForJob(job);
      })
      .on('cleaned', async (jobs: Job[]) => {
        for (const job of jobs) {
          await this.removeRedisKeyForJob(job);
        }
      });
  }

  /**
   * Retrieves the fully-formatted job index key for the supplied job description; consumers may also supply a string
   * key containing the job's key (i.e., equivalent to JobDescription#getKey).
   */
  protected getJobIndexKey(jobDesc: TrackedJobDescription<any> | string) {
    let key = jobDesc as string;
    let _jobDesc: TrackedJobDescription<any>;

    if (typeof jobDesc === 'object') {
      _jobDesc = jobDesc;
      key = _jobDesc.getKey();
    }

    return format(
      AbstractJobSchedulerService.JobIndexKeyFormat,
      this.domain,
      _jobDesc?.namespace?.length > 0 ? _jobDesc.namespace.join(';') : AbstractJobSchedulerService.DefaultNamespace,
      key,
    );
  }

  /**
   * Retrieves the domain key under which all jobs scheduled through this scheduler are scheduled.
   */
  protected get domain() {
    return (
      (this._domainDescriptorKey && JobDomainManager.getDomain(this._domainDescriptorKey)) || AbstractJobSchedulerService.DefaultJobDomain
    );
  }

  protected async _getJobIndexKeys(key: string): Promise<any[]> {
    let indexKeys = [];

    /* If notification type is not supplied, query redis for all keys that match the current domain and supplied user. */
    return new Promise<any[]>((resolve, reject) => {
      /* Resolve the repeat notification job indexing key that maps to the supplied notification and recipient. */

      const keyStream = this.redis.scanStream({
        match: key,
      });

      keyStream.on('data', (chunk) => {
        if (chunk?.length > 0) {
          indexKeys = indexKeys.concat(chunk);
        }
      });

      /* Resolve the promise on stream end so we know we can continue to remove jobs. */
      keyStream.on('end', () => resolve(indexKeys));

      keyStream.on('error', (err) => {
        reject(err);
        this.loggerService.error(
          format(
            '[AbstractJobService#_cancelJobs] Unable to cancel jobs mapped to key %s; ' +
              'the scanStream initiated for retrieving job keys failed: ',
            key,
          ) + err,
        );
      });
    });
  }

  protected async _getJobs(key: string): Promise<Job[]> {
    const indexKeys = await this._getJobIndexKeys(key);
    const jobs = [];
    for (const indexKey of indexKeys) {
      const type = await this.redis.type(indexKey);
      if (!type || !this.NotificationKeyQueryModes[type]) {
        this.loggerService.warn(`[AbstractJobService#_getJobs] Unknown type "${type}" for index key: ${indexKey}`);
        continue;
      }
      const jobIds = await this.NotificationKeyQueryModes[type](indexKey);
      for (const jobId of jobIds) {
        const job = await this.queue.getJob(jobId);
        if (job) {
          jobs.push(job);
        }
      }
    }
    return jobs;
  }

  /**
   * Cancels the job(s) that are described by the supplied key and name.
   */
  protected async _cancelJobs(key: string, name?: string) {
    /* Resolve the repeat notification job indexing key that maps to the supplied notification and recipient. */
    const indexKeys = await this._getJobIndexKeys(key);

    for (const indexKey of indexKeys) {
      /* First, determine the type of entry that is mapped by this key. */
      const type = await this.redis.type(indexKey);

      /* If the type is not defined, the supplied key is not set.  Log a warning and continue to the next job index ID. */
      if (!type) {
        this.loggerService.warn(
          format(
            '[AbstractJobService#_cancelJobs] Cannot cancel job mapped to index key %s, ' +
              'the job ID presently does not exist in redis.  It has either already been completed, or has been evicted.',
            indexKey,
          ),
        );
        continue;
      }

      /* Retrieve the job IDs from Redis that map to the resolved keys. */
      const jobIds = await this.NotificationKeyQueryModes[type](indexKey);

      for (const jobId of jobIds) {
        /* Retrieve the jobs mapping to the ID, and cancel them accordingly. */
        const job = await this.queue.getJob(jobId);
        job && (!name || job.name === name) && (await job.remove());
      }

      /* Remove the stored appointment key from Redis */
      await this.redis.del(indexKey);
    }
  }

  /**
   * Sets the domain descriptor key to the supplied value - should be invoked only by the @JobDomain
   * decorator.
   */
  public setDomainDescriptorKey(_domainDescriptorKey: string) {
    return (this._domainDescriptorKey = _domainDescriptorKey);
  }

  /**
   * Schedules a one-time execution job described by the supplied job description.
   */
  public async scheduleJob(jobDesc: JobDescription<any>, namespace?: string | string[], executeDate?: Date, timezone?: string);
  public async scheduleJob(jobDesc: JobDescription<any>, executeDate?: Date, timezone?: string);
  public async scheduleJob(
    jobDesc: JobDescription<any>,
    executeDateOrNamespace?: string | string[] | Date,
    timezoneOrExecuteDate?: Date | string,
    timezone?: string,
  ) {
    /* Type narrowing */
    let namespace: string | string[] = executeDateOrNamespace as string | string[];
    let executeDate = timezoneOrExecuteDate as Date;

    if (executeDateOrNamespace instanceof Date) {
      executeDate = executeDateOrNamespace;
      timezone = timezoneOrExecuteDate as string;
      namespace = null;
    }

    /* Invoke the implementation the one-time job args retriever */
    const jobSchedulingArgs = this.getJobArguments(jobDesc, typeof namespace === 'string' ? [namespace] : namespace);

    /* Ameliorate the job description with the domain descriptor key, if available */
    jobSchedulingArgs.jobDescription.domainDescriptorKey = this._domainDescriptorKey;

    /* Calc the delay, if applicable; otherwise, use null. */
    executeDate = executeDate || new Date();

    /* If a given job has the acceptableSchedulingHours property set, we will need to marshall the job's execution date
     * to the appropriate bounds. */
    if (jobDesc.acceptableSchedulingHours) {
      executeDate = getCompliantDates(executeDate, timezone, jobDesc.acceptableSchedulingHours)[0];
    }

    const delay = differenceInMilliseconds(executeDate, new Date());

    // Queue a job for the supplied job desc
    const _opts = extend(
      {
        delay: delay < 0 ? 0 : delay,
      },
      jobSchedulingArgs.jobOptions,
    );
    const job = await this.queue.queueJob(jobSchedulingArgs.jobDescription, _opts);

    // Expire the key one week after it's execution date. It should already be deleted by the queue listeners when the job is complete.
    const oneWeek = 604800000;
    // Set a key in the redis db for the supplied notification
    await this.redis.set(this.getJobIndexKey(jobSchedulingArgs.jobDescription), job.id, 'PX', _opts.delay + oneWeek);
  }

  /**
   * Schedules a repeatable job described by the supplied RepeatJobDescription.
   */
  public async scheduleRepeatJob(
    jobDesc: RepeatJobDescription<any>,
    namespaceOrRepeatType: string | string[] | RepeatType,
    repeatType?: RepeatType,
  ) {
    /* Type narrowing */
    let namespace: string | string[] = namespaceOrRepeatType as string | string[];

    if (namespaceOrRepeatType instanceof RepeatType) {
      repeatType = namespaceOrRepeatType;
      namespace = null;
    }

    /* Invoke the implementation of the repeat job args retriever */
    const repeatJobSchedulingArgs = this.getRepeatJobArguments(
      jobDesc,
      typeof namespace === 'string' ? [namespace] : namespace,
      repeatType,
    );

    /* Augment the job description with a parameters resolver, if necessary */
    repeatJobSchedulingArgs.jobDescription.domainDescriptorKey = this._domainDescriptorKey;

    const jobs = await this.queue.queueRepeatJob(
      repeatJobSchedulingArgs.jobDescription,
      repeatJobSchedulingArgs.repeatType,
      repeatJobSchedulingArgs.jobOptions,
    );

    /* Let's file the newly-created jobs against the appointment in our ODS.  Expiry time is the appointment's end - current time
     * (i.e. set to expire at the appointment end time). */
    jobs.length &&
      (await this.redis.sadd(
        this.getJobIndexKey(repeatJobSchedulingArgs.jobDescription),
        jobs.map((job) => job.id),
      ));
  }

  /**
   * Cancels the job(s) that are described by the supplied job description / namespace.  The supplied job description will
   * have its getKey parameter invoked to assemble the cancellable job key, and thus may use wildcards.
   */
  public async cancelJob(jobDesc: JobDescription<any>, namespace: string | string[] = '*') {
    /* Type narrowing */
    const _ns = typeof namespace === 'string' ? [namespace] : namespace;

    /* Retrieve the ID corresponding to this job description */
    const id = this.getJobIndexKey(this.getCancelJobDescription(jobDesc, _ns));

    /* Remove this job (or all jobs matching this key) from the scheduled set... */
    await this._cancelJobs(id, jobDesc.name);
  }

  /**
   * Returns all jobs that much the job description / namespace.
   */
  public async getJobs(jobDesc: JobDescription<any>, namespace: string | string[] = '*'): Promise<Job[]> {
    /* Type narrowing */
    const _ns = typeof namespace === 'string' ? [namespace] : namespace;

    /* Retrieve the ID corresponding to this job description */
    const id = this.getJobIndexKey(this.getCancelJobDescription(jobDesc, _ns));
    return await this._getJobs(id);
  }

  /**
   * Checks if there are any jobs for the given job desc that are active or waiting.
   * @param jobDesc
   * @param namespace
   */
  public async isJobWaitingOrActive(jobDesc: JobDescription<any>, namespace: string | string[] = '*'): Promise<boolean> {
    const jobs = await this.getJobs(jobDesc, namespace);
    for (const job of jobs) {
      if ((await job.isActive()) || (await job.isWaiting())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieves the job execution arguments that describe the execution of a one-time job according to the
   * supplied job description.
   */
  protected abstract getJobArguments(jobDesc: JobDescription<any>, namespace?: string[]): JobSchedulingArguments;

  /**
   * Retrieves the job execution arguments that describe the execution of a repeatable job according to the
   * supplied repeat job description.
   */
  protected abstract getRepeatJobArguments(
    jobDesc: RepeatJobDescription<any>,
    namespace: string[],
    repeatType?: RepeatType,
  ): RepeatJobSchedulingArguments;

  /**
   * Retrieves a TrackedJobDescription that describes the job(s) to be cancelled.
   */
  protected abstract getCancelJobDescription(jobDesc: JobDescription<any>, namespace: string[]): TrackedJobDescription<any>;
}
