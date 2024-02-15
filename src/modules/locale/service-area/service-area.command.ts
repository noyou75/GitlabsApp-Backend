import { AddressComponent, AddressType, GeocodeResult, GeocodingAddressComponentType } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Answers, prompt } from 'inquirer';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { Command, Positional } from '../../command/command.decorator';
import { MappingService } from '../../core/services/mapping.service';
import { ServiceAreaService } from './service-area.service';

@Injectable()
export class ServiceAreaCommand {
  constructor(private readonly mapping: MappingService, private readonly service: ServiceAreaService) {}

  @Command({ command: 'service-area:create <address>', describe: 'Create a new service area by providing an approximate address' })
  async create(
    @Positional({ name: 'address' })
    address: string,
  ) {
    const result = await this.ask(address);

    // TODO: Better error handling when a service area already exists
    // TODO: Link with existing users by searching for matching zipcodes and linking the service area
    const entity = await this.service.create(
      plainToClass(ServiceAreaEntity, {
        city: this.getAddressComponent(AddressType.locality, result).short_name,
        county: this.getAddressComponent(AddressType.administrative_area_level_2, result)?.short_name,
        state: this.getAddressComponent(AddressType.administrative_area_level_1, result)?.short_name,
        zipCode: this.getAddressComponent(AddressType.postal_code, result).short_name,
        geo: {
          type: 'Point',
          coordinates: [result.geometry.location.lng, result.geometry.location.lat],
        },
        active: true,
      }),
    );

    console.log(`Successfully created service area: ${entity.zipCode}`);

    const anotherInput = await prompt<Answers>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Do you want to create another service area?`,
        default: false,
      },
    ]);

    if (anotherInput.confirmed) {
      await this.create(null);
    }
  }

  private async ask(address: string): Promise<GeocodeResult> {
    let confirmed = false;

    do {
      const addressInput = await prompt<Answers>([
        {
          type: 'input',
          name: 'address',
          message: 'Enter the address of the service area:',
          default: address,
          when: () => !address,
        },
      ]);

      const results = await this.mapping.geocode(address || addressInput.address);

      if (!results.length) {
        console.warn(`Unable to find any results for the given address: ${address}`);
        address = null;
        continue;
      }

      const zipCode = this.getAddressComponent(AddressType.postal_code, results[0]).short_name;
      const formattedAddress = results[0].formatted_address;

      const confirmationInput = await prompt<Answers>([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Found '${zipCode}' zip code for service area '${formattedAddress}', is this correct?`,
          default: true,
        },
      ]);

      if (confirmationInput.confirmed) {
        confirmed = true;
        return results[0];
      } else {
        address = null;
      }
    } while (!confirmed);
  }

  private getAddressComponent(component: AddressType | GeocodingAddressComponentType, result: GeocodeResult): AddressComponent {
    return result.address_components.find((comp) => comp.types.includes(component));
  }
}
