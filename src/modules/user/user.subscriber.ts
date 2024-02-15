import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { includesColumn } from '../../common/entity.utils';
import { PatientDeactivationReason } from '../../common/enums/user-deactivation-reason.enum';
import { PatientUser, SpecialistUser, User } from '../../entities/user.entity';
import { IntercomConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { MappingService } from '../core/services/mapping.service';
import { TimezoneService } from '../core/services/timezone.service';
import { ServiceAreaService } from '../locale/service-area/service-area.service';
import { PatientRequestedAccountDeactivationNotification } from '../notification/notifications/patient-requested-account-deactivation.notification';
import { SpecialistWelcomeNotification } from '../notification/notifications/specialist-welcome.notification';
import { WelcomeNotification } from '../notification/notifications/welcome.notification';
import { NotificationService } from '../notification/services/notification.service';
import { StringEncoderService } from '../shared/services/string-encoder.service';
import { generateReferralCode } from './patient/patient-user.util';

// NOTE: Subscribers in TypeORM are not guaranteed to run in any specific order and are
// run asynchronously in parallel. This is the reason for creating a "kitchen sink" subscriber
// that ensures operations happen in the required order.

@Injectable()
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
    private readonly timezone: TimezoneService,
    private readonly mapping: MappingService,
    private readonly serviceArea: ServiceAreaService,
    private readonly notifications: NotificationService,
  ) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  async afterLoad(entity: User) {
    if (entity instanceof PatientUser) {
      entity.intercomIdentityHash = await StringEncoderService.sign(entity.id, this.config.get(IntercomConfig.IntercomIdentitySecret));
    }
  }

  async beforeInsert(event: InsertEvent<User>) {
    // Generate referral code
    await this.generateReferralCode(event.entity);

    // Encode Password
    await this.encodePassword(event.entity);

    // Set timezone
    await this.setTimezone(event.entity);

    // Set the address geocoding
    await this.setAddressGeocoding(event.entity);

    // Set the service area
    await this.setServiceArea(event.entity);
  }

  async beforeUpdate(event: UpdateEvent<User>) {
    // Encode Password
    if (includesColumn(event.updatedColumns, 'password')) {
      await this.encodePassword(event.entity as User);
    }

    if (this.includesAddressColumns(event.updatedColumns)) {
      // Set timezone
      await this.setTimezone(event.entity as User);

      // Set the address geocoding
      await this.setAddressGeocoding(event.entity as User);

      // Set service area
      await this.setServiceArea(event.entity as User);
    }
  }

  async afterInsert(event: InsertEvent<User>) {
    await this.sendWelcomeNotification(event.entity);
  }

  async afterUpdate(event: UpdateEvent<User>) {
    if (includesColumn(event.updatedColumns, ['deactivationDate', 'deactivationReason'])) {
      await this.sendDeactivationNotification(event.entity as User);
    }
  }

  // ---

  private includesAddressColumns(columns: ColumnMetadata[]): boolean {
    return includesColumn(columns, ['address.street', 'address.city', 'address.state', 'address.zipCode']);
  }

  private async generateReferralCode(user: User): Promise<void> {
    if (!(user instanceof PatientUser)) {
      return;
    }

    /* Generate a unique referral ID that not collide with any other existing ID. */
    user.referralCode = await generateReferralCode();
  }

  private async encodePassword(user: User): Promise<void> {
    if (user.password) {
      user.password = await StringEncoderService.encode(user.password);
    }
  }

  private async setTimezone(user: User): Promise<void> {
    user.timezone = await this.timezone.getTimezoneForUser(user);
  }

  private async setAddressGeocoding(user: User): Promise<void> {
    if (user.address) {
      try {
        const results = await this.mapping.geocode(user.address.composed);
        if (results.length) {
          user.address.geo = {
            type: 'Point',
            coordinates: [results[0].geometry.location.lng, results[0].geometry.location.lat],
          };
        } else {
          user.address.geo = null;
        }
      } catch (e) {
        // TODO: Log this error for further investigation
      }
    }
  }

  private async setServiceArea(user: User): Promise<void> {
    if (user.address) {
      user.address.serviceArea = (await this.serviceArea.getByZipCode(user.address.zipCode)) ?? null;
    }
  }

  private async sendWelcomeNotification(user: User): Promise<void> {
    if (user instanceof PatientUser) {
      await this.notifications.send(WelcomeNotification, user);
    }

    if (user instanceof SpecialistUser) {
      await this.notifications.send(SpecialistWelcomeNotification, user);
    }

    return;
  }

  private async sendDeactivationNotification(user: User): Promise<void> {
    if (user instanceof PatientUser && user.deactivationDate && user.deactivationReason === PatientDeactivationReason.PatientRequested) {
      await this.notifications.send(PatientRequestedAccountDeactivationNotification, user);
    }

    return;
  }
}
