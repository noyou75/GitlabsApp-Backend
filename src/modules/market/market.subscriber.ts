import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { MarketEntity } from '../../entities/market.entity';

@Injectable()
@EventSubscriber()
export class MarketSubscriber implements EntitySubscriberInterface<MarketEntity> {
  constructor(@InjectConnection() readonly connection: Connection) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  listenTo() {
    return MarketEntity;
  }

  async beforeInsert(event: InsertEvent<MarketEntity>) {
    await this.setSchedule(event.entity);
  }

  // ---

  private async setSchedule(entity: MarketEntity) {
    if (!entity.schedule) {
      entity.schedule = {
        saturday: {
          disabled: true,
        },
        sunday: {
          disabled: true,
        },
      };
    }
  }
}
