import { forwardRef, Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { BullModule } from '@nestjs/bull';
import { FileProcessorQueueService } from './services/file-processor-queue.service';
import { FileProcessorJobSchedulerService } from './services/file-processor-job-scheduler.service';
import { FileProcessorJobService } from './services/file-processor-job.service';
import { AppointmentDeliveryForm } from './processors/appointment-delivery-form';
import { AppointmentModule } from '../appointment/appointment.module';
import { FileModule } from '../file/file.module';
import { FileProcessorQueueName } from './file-processors';
import { AppointmentFormCommand } from './command/appointment-form.command';

@Module({
  imports: [
    SharedModule,
    FileModule,
    forwardRef(() => AppointmentModule),
    BullModule.registerQueueAsync({
      name: FileProcessorQueueName,
      useFactory: async () => {
        return {
          settings: {
            lockDuration: 600000, //10 minutes
            lockRenewTime: 60000,
            retryProcessDelay: 5000,
          },
        };
      },
    }),
  ],
  providers: [
    FileProcessorJobService,
    FileProcessorQueueService,
    FileProcessorJobSchedulerService,
    AppointmentDeliveryForm,
    AppointmentFormCommand,
  ],
  exports: [FileProcessorJobService, FileProcessorQueueService, FileProcessorJobSchedulerService],
})
export class FileProcessorModule {}
