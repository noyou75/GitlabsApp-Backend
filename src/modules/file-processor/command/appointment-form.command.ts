import { Injectable } from '@nestjs/common';
import { Command, Positional } from '../../command/command.decorator';
import { LoggerService } from '../../core/services/logger.service';
import { FileProcessorJobService } from '../services/file-processor-job.service';
import { AppointmentService } from '../../appointment/appointment.service';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { Answers, prompt } from 'inquirer';

@Injectable()
export class AppointmentFormCommand {
  constructor(
    private readonly logger: LoggerService,
    private readonly fileProcessor: FileProcessorJobService,
    private readonly appointments: AppointmentService,
  ) {}

  @Command({
    command: 'generate:appointment-form <appointmentId>',
    describe: 'Queue the generation of the delivery form for an appointment',
  })
  async run(
    @Positional({
      name: 'appointmentId',
      describe: 'The ID of the appointment',
      type: 'string',
    })
    appointmentId: string,
  ) {
    const appointment = await this.appointments.getRepository().findOne(appointmentId);

    if (!appointment) {
      return this.logger.error(`Appointment ${appointmentId} not found`);
    }

    const answers = await prompt<Answers>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Appointment has a status of ${appointment.status}. It should be confirmed, are you sure you want to generate?`,
        default: false,
        when: () => appointment.status !== AppointmentStatus.Confirmed,
      },
    ]);

    if (answers.confirmed !== false) {
      await this.fileProcessor.generateAppointmentDeliveryForm(appointment);
      this.logger.log(`Message sent to generate delivery form for appointment ${appointmentId}`);
    }
  }
}
