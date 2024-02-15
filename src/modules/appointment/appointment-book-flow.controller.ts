import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { PatientUser, User } from '../../entities/user.entity';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { AppointmentBookingFlowEvent } from './appointment-analytics.event';
import { AppointmentService } from './appointment.service';
import { BookStepDto } from './dto/book-step.dto';

/**
 * The appointment book flow controller handles endpoints that specifically pertain to the patient booking an
 * appointment via their portal.  The primary motivation for this separate controller is the clean
 * delineation of endpoint permissions.
 */
@Controller('appointment-book-flow')
export class AppointmentBookFlowController {
  constructor(private readonly appointments: AppointmentService, private readonly analytics: AnalyticsService) {}

  /**
   * Invoked whenever a patient proceeds to another step in the appointment booking flow.
   */
  @Post('book-step')
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  @HttpCode(200)
  async bookStep(@Body() bookStepDto: BookStepDto) {
    const user = RequestContext.get<User>(REQUEST_CONTEXT_USER) as PatientUser;

    /* Notification scheduling only occurs if a user is in context, and the user has not booked an appointment with us previously. */
    user && !(await this.appointments.hasPreviousAppointments(user)) && (await this.appointments.setBookingReminder(user));

    /* Invoke an analytics event describing the book step propagation */
    this.analytics.trackEvent(
      new AppointmentBookingFlowEvent(bookStepDto.step, user, {
        ordinal: bookStepDto.ordinal,
        ...bookStepDto.stepData,
      }),
    );
  }
}
