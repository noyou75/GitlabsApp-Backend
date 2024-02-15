import { OpeningHours, Place } from '@googlemaps/google-maps-services-js';
import { LabLocationEntity } from '../../../../entities/lab-location.entity';

export class LabLocationDetailedDto extends LabLocationEntity {
  phoneNumber: string;

  hours: OpeningHours;

  constructor(entity: LabLocationEntity, details: Place) {
    super();

    Object.assign(this, entity);

    this.phoneNumber = details.international_phone_number;
    this.hours = details.opening_hours;
  }
}
