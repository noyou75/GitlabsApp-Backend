import { Injectable } from '@nestjs/common';
import { addHours, addSeconds, format, isAfter } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { AppointmentBookingTypes } from '../../../common/enums/appointment-booking-types.enum';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { Availability, TimeSlotDescription, AvailabilityDescriptor } from '../../availability/availability.decorator';
import { AppointmentConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';

/**
 * Describes the availability configuration aspects that apply to appointments.
 */
@Injectable()
@Availability(AppointmentBookingTypes.PatientAppointment)
export class PatientAppointmentAvailability extends AvailabilityDescriptor {
  constructor(private configService: ConfigService) {
    super();
  }

  getTimeSlotDescription(serviceArea: ServiceAreaEntity, startAt: Date): TimeSlotDescription {
    return {
      startAt,
      // TODO: Pull timeslot duration from Market configuration
      endAt: addSeconds(startAt, this.configService.get(AppointmentConfig.TimeslotDuration)),
      price: this.getPrice(serviceArea.market.price, startAt, serviceArea.timezone),
    };
  }

  getPrice(base: number, startAt: Date, tz: string): number {
    // Subtract $10 for slots more than 2.5 (60 hours) days away
    if (isAfter(startAt, addHours(new Date(), 60))) {
      base -= 1000;
    }

    // Add $10 for 5am slots
    if (['05:00', '06:00'].includes(format(utcToZonedTime(startAt, tz), 'HH:mm'))) {
      base += 1000;
    }

    // Add $5 for 7-8am slots
    if (['07:00'].includes(format(utcToZonedTime(startAt, tz), 'HH:mm'))) {
      base += 500;
    }

    return base;
  }
}
