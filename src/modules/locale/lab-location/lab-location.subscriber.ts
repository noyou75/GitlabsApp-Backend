import { Injectable } from '@nestjs/common';
import { Connection, EntityManager, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { LabLocationEntity } from '../../../entities/lab-location.entity';
import { includesColumn } from '../../../common/entity.utils';
import { MappingService } from '../../core/services/mapping.service';
import slug from "slug";
import { ServiceAreaEntity } from "../../../entities/service-area.entity";

@Injectable()
@EventSubscriber()
export class LabLocationSubscriber implements EntitySubscriberInterface<LabLocationEntity> {
  constructor(@InjectConnection() readonly connection: Connection, private readonly mapping: MappingService) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  listenTo() {
    return LabLocationEntity;
  }

  async beforeInsert(event: InsertEvent<LabLocationEntity>) {
    if (event.entity?.place_id) {
      await this.setAddressGeocoding(event.entity);
      await this.setSlug(event.entity);
    }
  }

  async afterInsert(event: InsertEvent<LabLocationEntity>) {
    await this.setMarkets(event.entity, event.manager);
  }

  async beforeUpdate(event: UpdateEvent<LabLocationEntity>) {
    if (event.entity instanceof LabLocationEntity) {
      if (includesColumn(event.updatedColumns, ['place_id']) && event.entity) {
        await this.setAddressGeocoding(event.entity);
      }
      await this.setSlug(event.entity);
    }
  }

  private async setSlug(lab: LabLocationEntity): Promise<void> {
    if (lab?.address?.composed && lab?.public) {
      lab.slug = slug(lab.address.composed, slug.defaults.modes.rfc3986);
    } else {
      lab.slug = null;
    }
  }

  private async setAddressGeocoding(lab: LabLocationEntity): Promise<void> {
    const place = await this.mapping.place(lab.place_id);
    if (place) {
      lab.address = this.mapping.placeToAddress(place);
    }
  }

  /**
   * Must run after the entity has been created as typeorm does process many to many relationships in subscribers
   */
  private async setMarkets(lab: LabLocationEntity, em: EntityManager): Promise<void> {
    if (!lab?.address?.zipCode) {
      return;
    }
    lab.markets = lab.markets || [];

    // gets service areas with the same zip code
    const serviceAreas = await em.find<ServiceAreaEntity>(ServiceAreaEntity, {
      zipCode: lab.address.zipCode
    });

    // filter out the markets from the service area that are not assigned to the lab location already
    const markets = serviceAreas
      .filter(s => s.market && !lab.markets.find(l => l.id === s.market.id))
      .map(s => s.market);

    // if new markets add them and then save
    if (markets.length > 0) {
      lab.markets.push(...markets);
      await em.save(lab);
    }
  }
}
