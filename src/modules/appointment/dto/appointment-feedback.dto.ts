import { IsNotEmpty } from 'class-validator';

export class AppointmentFeedbackDto {
  @IsNotEmpty()
  feedback: string;
}
