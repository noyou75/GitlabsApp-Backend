import { forwardRef, Inject } from '@nestjs/common';
import { AppointmentService } from '../appointment/appointment.service';
import { EntityManager } from 'typeorm';
import { FilePurpose } from '../../common/enums/file-purpose.enum';
import { FileEntity } from '../../entities/file.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { Job } from 'bull';
import { JobDescription } from '../job/services/abstract-queue.service';
import { FileProcessorQueueService } from './services/file-processor-queue.service';
import { AbstractQueue } from '../job/types/abstract.queue';

export const FileProcessorQueueName = 'FileProcessor';

export interface IFileProcessor<T> {
  run(job?: Job<JobDescription<T>>): Promise<any>;
}

export interface FileProcessorDescription {
  id: string;
  aborted?: boolean;
}

export interface AppointmentFileProcessorDescription extends FileProcessorDescription {
  appointment?: AppointmentEntity;
}

export abstract class AbstractFileProcessor<T> extends AbstractQueue implements IFileProcessor<T> {
  constructor(
    @InjectEntityManager() protected readonly entityManager: EntityManager,
    @Inject(forwardRef(() => FileProcessorQueueService)) protected readonly fileProcessorQueueService: FileProcessorQueueService,
  ) {
    super();
  }

  abstract getFileName(job?: Job<JobDescription<T>>): string | Promise<string>;

  abstract getFilePurpose(job?: Job<JobDescription<T>>): FilePurpose | Promise<FilePurpose>;

  abstract getFileData(job?: Job<JobDescription<T>>): string | Promise<string>;

  async createFile(job?: Job<JobDescription<T>>): Promise<FileEntity> {
    const file = new FileEntity();
    // Strip all non-printable non-ASCII characters from the name before passing it as the filename
    file.name = (await this.getFileName(job)).replace(/[^\x20-\x7E]+/g, '');
    file.purpose = await this.getFilePurpose(job);
    file.data = await this.getFileData(job);
    return file;
  }

  async save(file: FileEntity, job?: Job<JobDescription<T>>): Promise<FileEntity> {
    if (await this.isAborted(job)) {
      return null;
    }
    return await this.entityManager.save(file);
  }

  async run(job: Job<JobDescription<T>>): Promise<void> {
    const file = await this.createFile(job);
    await this.save(file, job);
  }

  /**
   *  Refresh the job data and see if the aborted flag is set. This is done in FileProcessorJobSchedulerService
   *  when a new request comes in for a resource already being generated.
   */
  async isAborted(job?: Job<JobDescription<T>>): Promise<boolean> {
    if (!job) {
      return false;
    }
    const updatedJob = await this.fileProcessorQueueService.getJob(job.id);
    return !!updatedJob?.data?.aborted;
  }

  protected getQueueName(): string {
    return FileProcessorQueueName;
  }
}

export abstract class AbstractAppointmentFileProcessor
  extends AbstractFileProcessor<AppointmentFileProcessorDescription>
  implements IFileProcessor<AppointmentFileProcessorDescription> {
  @Inject(forwardRef(() => AppointmentService))
  protected readonly appointmentService: AppointmentService;

  async run(job: Job<JobDescription<AppointmentFileProcessorDescription>>): Promise<void> {
    if (!job.data.data.appointment) {
      job.data.data.appointment = await this.getJobEntity(job);
    }
    await super.run(job);
  }

  protected async getJobEntity(job: Job<JobDescription<AppointmentFileProcessorDescription>>): Promise<AppointmentEntity> {
    return await this.appointmentService.getRepository().findOneOrFail({
      id: job.data.data.id,
    });
  }
}
