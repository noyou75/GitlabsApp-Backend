import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import tzs from 'timezones.json';
import { LoggerService } from './logger.service';
import { MappingService } from './mapping.service';
import { RedisService } from './redis.service';
import { StringEncoderService } from '../../shared/services/string-encoder.service';
import { User } from '../../../entities/user.entity';

export class Timezone {
  id: string;
  name: string;
  text: string;
  abbr: string;
  offset: number;
}

@Injectable()
export class TimezoneService {
  timezones: Timezone[] = [];

  constructor(
    private readonly mapping: MappingService,
    private readonly redis: RedisService,
    private readonly stringEncoder: StringEncoderService,
    private readonly logger: LoggerService,
  ) {
    // @ts-ignore
    // ! Ignore typechecking on next line due to wrong type definitions in timezone.json module
    (tzs as tzs.Timezone[]).forEach(zone => {
      zone.utc.forEach(id => {
        // Only include timezones with / to remove weird timezones such as EST5ETD
        if (!id.includes('/')) {
          return;
        }

        this.timezones.push(
          plainToClass(Timezone, {
            id,
            name: zone.value,
            text: zone.text,
            abbr: zone.abbr,
            offset: zone.offset,
          }),
        );
      });
    });

    this.timezones.sort((tz1, tz2) => tz1.id.localeCompare(tz2.id));
  }

  has(id: string) {
    return this.timezones.some(tz => tz.id.toLowerCase() === id.toLowerCase());
  }

  get(id: string) {
    return this.timezones.find(tz => tz.id.toLowerCase() === id.toLowerCase());
  }

  ids() {
    return this.timezones.map(tz => tz.id);
  }

  async getTimezoneForUser(user: User) {
    if (!user || !user.address) {
      return null;
    }

    try {
      return await this.getTimezoneForAddress(user.address.zipCode);
    } catch (err) {
      this.logger.warn(
        `ZipToTimezone mapping could no the found for zip code ${user.address.zipCode}, trying full address => ${user.address.composed}`,
      );
      this.logger.error(err);
      return await this.getTimezoneForAddress(user.address.composed);
    }
  }

  async getTimezoneForAddress(address: string): Promise<string> {
    if (!address) {
      return null;
    }

    const cacheKey = `timezone:${StringEncoderService.base64Encode(address)}`;
    const cache = this.redis.getClient();
    const cached = await cache.get(cacheKey);

    if (cached) {
      this.logger.log(`ZipToTimezone mapping found in cache => ${cacheKey}, value: ${cached}`);
      return cached;
    }

    try {
      const geocoding = await this.mapping.geocode(address);

      if (geocoding.length < 1) {
        throw new Error(`Timezone Error: Unable to find geocoding data for address: ${address}`);
      }

      const location = geocoding[0].geometry.location;

      const timezone = await this.mapping.timezone(location);

      if (!timezone) {
        throw new Error(`Timezone Error: Unable to find timezone data for address: ${address}, location: ${location}`);
      }

      // Save in cache (expire in 1 week)
      await cache.set(cacheKey, timezone.timeZoneId, 'EX', 604800);

      this.logger.log(`ZipToTimezone mapping saved to cache => ${cacheKey}, address: ${address}, value: ${timezone.timeZoneId}`);

      return timezone.timeZoneId;
    } catch (err) {
      // Log proper error message from Google API
      throw new Error(err.json ? err.json.error_message || err.json.errorMessage : err);
    }
  }
}
