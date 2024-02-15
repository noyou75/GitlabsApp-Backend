import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { StaffUser } from '../../entities/user.entity';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { RolesGuard } from '../auth/roles.guard';
import { OutOfServiceAreaEvent } from './availability-analytics.event';
import { AvailabilityV2Service } from './availability-v2.service';
import { AvailabilityResponseDto } from './dto/availability.dto';
import { TimeslotQueryDto } from './dto/timeslot-query.dto';
import { UpcomingAvailabilityDto } from './dto/upcoming-availability.dto';

/**
 * Generic availability controller - used to resolve availability of customizable consumer appointment/booking types.
 */
@Controller('availability')
@UseGuards(RolesGuard)
export class AvailabilityController {
  constructor(private availabilityV2: AvailabilityV2Service, private analyticsService: AnalyticsService) {}

  @Get('upcoming-timeslots/:type')
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  async upcomingTimeslots(@Param() params: UpcomingAvailabilityDto, @Query() query: TimeslotQueryDto): Promise<AvailabilityResponseDto> {
    const isStaff = RequestContext.get(REQUEST_CONTEXT_USER) instanceof StaffUser;

    const availability = await this.availabilityV2.getTimeslots(params.type, query.zip, query.days || 5, {
      from: query.from,
      specialist: await query.specialist,
      appointment: await query.appointment,
      ignoreBookingRestrictions: isStaff,
    });

    if (!availability.serviceable) {
      // Track users who search for appointments in a zip code outside the service areas
      if (!isStaff) {
        this.analyticsService.trackEvent(new OutOfServiceAreaEvent(query.zip));
      }

      return new AvailabilityResponseDto(false, [], undefined);
    }

    return new AvailabilityResponseDto(availability.serviceable, availability.timeslots, availability.tz);
  }
}
