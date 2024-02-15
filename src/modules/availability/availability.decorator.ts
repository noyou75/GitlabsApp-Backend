import { SetMetadata } from '@nestjs/common';
import { ServiceAreaEntity } from '../../entities/service-area.entity';

export const AvailabilityMetadataKey = 'availability-metadata';

/**
 * Availability decorator marks a given class as a descriptor of bookable availability.  Classes annotated with this
 * decorator will be used to establish the configurable parameters used to populate timeslot definitions when
 * the retrieve timeslots endpoint is queried with the supplied token.  Annotated classes must be designated
 * as @Injectable.
 */
export function Availability(token: string) {
  return SetMetadata(AvailabilityMetadataKey, token);
}

/**
 * All availability definition classes must implement AvailabiiltyDescriptor.
 */
export abstract class AvailabilityDescriptor {
  // Returns a description of the time slot with dynamic properties. This includes things like
  // the given start date, dynamic end date, and dynamic price.
  abstract getTimeSlotDescription(serviceArea: ServiceAreaEntity, date: Date): TimeSlotDescription;
}

export interface TimeSlotDescription {
  startAt: Date;
  endAt: Date;
  price: number;
}
