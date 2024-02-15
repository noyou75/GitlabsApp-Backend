import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';

@Injectable()
@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface {
  constructor(@InjectConnection() private readonly connection: Connection) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  async beforeInsert(event: InsertEvent<any>) {
    // TODO: Generate audit log entries based on entity events
  }
}
