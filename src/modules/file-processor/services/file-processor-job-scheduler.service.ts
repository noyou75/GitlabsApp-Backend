import {
  AbstractJobSchedulerService,
  JobSchedulingArguments,
  RepeatJobSchedulingArguments,
  TrackedJobDescription,
} from '../../job/services/abstract-job-scheduler.service';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../core/services/redis.service';
import { FileProcessorJobDescription, FileProcessorQueueService, RepeatFileProcessorJobDescription } from './file-processor-queue.service';
import { format } from 'util';
import { RepeatType } from '../../job/types/repeat-type';
import { FileProcessorDescription } from '../file-processors';

class FileProcessorJobDescriptionImpl implements FileProcessorJobDescription, TrackedJobDescription<FileProcessorDescription> {
  public data: FileProcessorDescription;
  public name = '';

  private static readonly FileProcessorJobKeyTpl = 'FileProcessor:%s:%s';

  constructor(jobDesc: FileProcessorJobDescription, public domain: string, public namespace: string[]) {
    this.data = jobDesc.data;
    this.name = jobDesc.name;
  }

  getKey() {
    return FileProcessorJobDescriptionImpl.getKey(this.data, this.name);
  }

  public static getKey(data: FileProcessorDescription, name: string) {
    return format(FileProcessorJobDescriptionImpl.FileProcessorJobKeyTpl, name, data.id);
  }
}

class RepeatFileProcessorJobDescriptionImpl extends FileProcessorJobDescriptionImpl implements RepeatFileProcessorJobDescription {
  public timezone: string;
  public strikeDate: Date;

  constructor(jobDesc: RepeatFileProcessorJobDescription, public domain: string, namespace?: string[]) {
    super(jobDesc, domain, namespace);
    this.timezone = jobDesc.timezone;
    this.strikeDate = jobDesc.strikeDate;
  }
}

@Injectable()
export class FileProcessorJobSchedulerService extends AbstractJobSchedulerService {
  static readonly FileProcessorDomain = 'FileProcessorDomain';

  constructor(protected readonly fileProcessorQueueService: FileProcessorQueueService, redisService: RedisService) {
    super(fileProcessorQueueService, redisService);
  }

  protected getJobArguments(jobDesc: FileProcessorJobDescription, namespace?: string[]): JobSchedulingArguments {
    return {
      jobDescription: new FileProcessorJobDescriptionImpl(jobDesc, FileProcessorJobSchedulerService.FileProcessorDomain, namespace),
      jobOptions: {
        attempts: 5,
        backoff: 5000,
      },
    };
  }

  protected getRepeatJobArguments(
    jobDesc: RepeatFileProcessorJobDescription,
    namespace: string[],
    repeatType?: RepeatType,
  ): RepeatJobSchedulingArguments {
    return {
      jobDescription: new RepeatFileProcessorJobDescriptionImpl(jobDesc, FileProcessorJobSchedulerService.FileProcessorDomain, namespace),
      repeatType,
    };
  }

  public getCancelJobDescription(jobDesc: FileProcessorJobDescription, namespace: string[]): FileProcessorJobDescriptionImpl {
    return new FileProcessorJobDescriptionImpl(jobDesc, FileProcessorJobSchedulerService.FileProcessorDomain, namespace);
  }

  /**
   * If same job is waiting cancel it. If it is already running set the aborted flag
   */
  public async beforeScheduleJob(jobDesc: FileProcessorJobDescription, namespace: string | string[]): Promise<void> {
    const jobs = await this.getJobs(jobDesc, namespace);
    for (const job of jobs) {
      if (await job.isActive()) {
        await job.update({ ...job.data, ...{ aborted: true } });
      } else if ((await job.isWaiting()) || (await job.isDelayed())) {
        await job.remove();
      }
    }
  }
}
