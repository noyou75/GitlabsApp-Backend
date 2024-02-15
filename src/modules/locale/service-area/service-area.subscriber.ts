import { AddressComponent, AddressType, GeocodeResult, GeocodingAddressComponentType } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { includesColumn } from '../../../common/entity.utils';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { PatientUser } from '../../../entities/user.entity';
import { MappingService } from '../../core/services/mapping.service';

@Injectable()
@EventSubscriber()
export class ServiceAreaSubscriber implements EntitySubscriberInterface<ServiceAreaEntity> {
  constructor(@InjectConnection() readonly connection: Connection, private readonly mapping: MappingService) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  listenTo() {
    return ServiceAreaEntity;
  }

  async beforeInsert(event: InsertEvent<ServiceAreaEntity>) {
    await this.updateLocationData(event.entity);
  }

  async beforeUpdate(event: UpdateEvent<ServiceAreaEntity>) {
    if (event.entity instanceof ServiceAreaEntity && includesColumn(event.updatedColumns, ['zipCode'])) {
      await this.updateLocationData(event.entity);
    }
  }

  async afterInsert(event: InsertEvent<ServiceAreaEntity>) {
    await event.manager
      .getRepository(PatientUser)
      .update({ address: { zipCode: event.entity.zipCode } }, { address: { serviceArea: event.entity } });
  }

  // ---

  private async updateLocationData(entity: ServiceAreaEntity) {
    const geocoding = await this.mapping.geocode(entity.zipCode);

    if (!geocoding.length) {
      throw new Error(`Unable to find any geocoding results for zip code: ${entity.zipCode}`);
    }

    const geocode = geocoding[0];

    entity.city =
      this.getAddressComponent(AddressType.locality, geocode)?.short_name ??
      this.getAddressComponent(AddressType.administrative_area_level_3, geocode)?.short_name ??
      this.getAddressComponent(AddressType.neighborhood, geocode)?.short_name;
    entity.county = this.getAddressComponent(AddressType.administrative_area_level_2, geocode)?.short_name;
    entity.state = this.getAddressComponent(AddressType.administrative_area_level_1, geocode)?.short_name;
    entity.geo = {
      type: 'Point',
      coordinates: [geocode.geometry.location.lng, geocode.geometry.location.lat],
    };

    const timezone = await this.mapping.timezone(geocode.geometry.location);

    if (!timezone) {
      throw new Error(`Unable to find any timezone results for zip code: ${entity.zipCode}`);
    }

    entity.timezone = timezone.timeZoneId;
  }

  private getAddressComponent(component: AddressType | GeocodingAddressComponentType, result: GeocodeResult): AddressComponent {
    return result.address_components.find((comp) => comp.types.includes(component));
  }
}
