import { Injectable } from '@nestjs/common';
import { JobOptions, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { AbstractQueueService, JobDescription, RepeatJobDescription } from '../../job/services/abstract-queue.service';
import { AppointmentQueueName } from '../queue/appointment-queue.config';

/**
 * An interface for consumers to define appointment jobs that run once.
 */
export type AppointmentJobDescription = JobDescription<AppointmentEntity>;

/**
 * An interface for consumer to define appointment jobs that run multiple times.
 */
export interface RepeatAppointmentJobDescription extends AppointmentJobDescription, RepeatJobDescription<AppointmentEntity> {}

/**
 * The appointment queue service is an appointment-tier abstraction that is responsible for managing interactions with the
 * queue, handling data transformation between the public interface and the job processing data.
 */
@Injectable()
export class AppointmentQueueService extends AbstractQueueService {
  constructor(@InjectQueue(AppointmentQueueName) readonly queue: Queue) {
    super();
  }

  protected getQueue(): Queue {
    return this.queue;
  }

  /**
   * Queue needs to translate the object data into the appropriate IDs, since we don't want to store the object data in the ODS.
   */
  async queueJob(jobDesc: AppointmentJobDescription, opts?: JobOptions) {
    return await super.queueJob(
      {
        ...jobDesc,
        data: {
          appointmentId: jobDesc.data.id,
        },
      },
      opts,
    );
  }
}
