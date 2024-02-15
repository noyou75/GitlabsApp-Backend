import { FileProcessorJobSchedulerService } from './file-processor-job-scheduler.service';
import { Inject } from '@nestjs/common';
import { FileProcessorJobDescription } from './file-processor-queue.service';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { AppointmentDeliveryForm } from '../processors/appointment-delivery-form';

export class FileProcessorJobService {
  static namespace = 'file_generation';

  @Inject()
  private fileProcessorJobSchedulerService: FileProcessorJobSchedulerService;

  public async generateAppointmentDeliveryForm(appointment: AppointmentEntity | string) {
    /* Form a job description for invoking the patient incomplete booking notification */
    const jobDesc: FileProcessorJobDescription = {
      name: AppointmentDeliveryForm.name,
      data: {
        id: typeof appointment === 'string' ? appointment : appointment.id,
      },
    };

    /* Clean up existing scheduled/running jobs */
    await this.fileProcessorJobSchedulerService.beforeScheduleJob(jobDesc, FileProcessorJobService.namespace);
    return await this.fileProcessorJobSchedulerService.scheduleJob(jobDesc, FileProcessorJobService.namespace);
  }

  /**
   * Returns true if there is a job in the waiting or active state
   */
  public async isAppointmentDeliveryFormProcessing(appointment: AppointmentEntity | string): Promise<boolean> {
    const jobDesc: FileProcessorJobDescription = {
      name: AppointmentDeliveryForm.name,
      data: {
        id: typeof appointment === 'string' ? appointment : appointment.id,
      },
    };
    return await this.isFileProcessing(jobDesc, FileProcessorJobService.namespace);
  }

  protected async isFileProcessing(jobDesc: FileProcessorJobDescription, namespace: string | string[] = '*'): Promise<boolean> {
    return await this.fileProcessorJobSchedulerService.isJobWaitingOrActive(jobDesc, namespace);
  }
}
