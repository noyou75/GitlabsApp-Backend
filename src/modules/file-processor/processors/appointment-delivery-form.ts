import { AbstractAppointmentFileProcessor, AppointmentFileProcessorDescription, FileProcessorQueueName } from '../file-processors';
import { FilePurpose } from '../../../common/enums/file-purpose.enum';
import { format as formatDate } from 'date-fns';
import { FileEntity } from '../../../entities/file.entity';
import { Job } from 'bull';
import { JobDescription } from '../../job/services/abstract-queue.service';
import { Process } from '@nestjs/bull';
import { Processor, ProcessorType } from '../../job/decorators/processor.decorator';

@Processor({ name: FileProcessorQueueName, type: ProcessorType.worker })
export class AppointmentDeliveryForm extends AbstractAppointmentFileProcessor {
  public static ProcessorName = 'AppointmentDeliveryForm';

  async getFileData(job: Job<JobDescription<AppointmentFileProcessorDescription>>): Promise<string> {
    const buffer = await this.appointmentService.generateDeliveryFormPdf(job.data.data.appointment);
    return buffer.toString('base64');
  }

  getFileName(job: Job<JobDescription<AppointmentFileProcessorDescription>>): string {
    return `${formatDate(job.data.data.appointment.startAt, 'MM-dd-yyyy')} - ${
      job.data.data.appointment.patient.name
    } - Getlabs Delivery Form.pdf`;
  }

  getFilePurpose(): FilePurpose {
    return FilePurpose.AppointmentDeliveryForm;
  }

  async save(file: FileEntity, job: Job<JobDescription<AppointmentFileProcessorDescription>>): Promise<FileEntity> {
    if (await this.isAborted(job)) {
      this.logJobStep(job, 'Delivery form not saved, aborted by duplicate incoming job');
      return null;
    }
    job.data.data.appointment.deliveryForm = file;
    await this.entityManager.save(job.data.data.appointment);
    return job.data.data.appointment.deliveryForm;
  }

  @Process(AppointmentDeliveryForm.ProcessorName)
  async processJob(job: Job<JobDescription<AppointmentFileProcessorDescription>>): Promise<void> {
    this.logJobStep(job, `Begin processor - ${FileProcessorQueueName}#${AppointmentDeliveryForm.ProcessorName}`);
    await super.run(job);
    this.logJobStep(job, `End processor - ${FileProcessorQueueName}#${AppointmentDeliveryForm.ProcessorName}`);
  }
}
