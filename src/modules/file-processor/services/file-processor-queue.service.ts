import { AbstractQueueService, JobDescription, RepeatJobDescription } from '../../job/services/abstract-queue.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FileProcessorDescription, FileProcessorQueueName } from '../file-processors';
import { Injectable } from '@nestjs/common';

/**
 * An interface for consumers to define appointment jobs that run once.
 */
export type FileProcessorJobDescription = JobDescription<FileProcessorDescription>;

/**
 * An interface for consumer to define appointment jobs that run multiple times.
 */
export interface RepeatFileProcessorJobDescription extends FileProcessorJobDescription, RepeatJobDescription<FileProcessorDescription> {}

@Injectable()
export class FileProcessorQueueService extends AbstractQueueService {
  constructor(@InjectQueue(FileProcessorQueueName) readonly queue: Queue) {
    super();
  }

  protected getQueue(): Queue<any> {
    return this.queue;
  }
}
