import { AddressComponent, AddressType, GeocodingAddressComponentType, Place } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { plainToClass, plainToClassFromExist } from 'class-transformer';
import { Answers, prompt } from 'inquirer';
import { startCase } from 'lodash';
import slug from 'slug';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { enumKeys } from '../../../common/enum.utils';
import { LabCompany } from '../../../common/enums/lab-company.enum';
import { LabLocationEntity } from '../../../entities/lab-location.entity';
import { LabLocationsData } from '../../../extra/lab-locations.data';
import { Command, Positional } from '../../command/command.decorator';
import { MappingService } from '../../core/services/mapping.service';
import { LabLocationService } from './lab-location.service';

@Injectable()
export class LabLocationCommand {
  constructor(private readonly mapping: MappingService, private readonly service: LabLocationService) {}

  @Command({ command: 'lab-location:create <query>', describe: 'Create a new lab location by providing a search query' })
  async create(
    @Positional({ name: 'query' })
    query: string,
  ) {
    const result = await this.ask(query);

    try {
      const lab = result[0];
      const place = result[1];

      // TODO: Better error handling when a lab location already exists
      const entity = plainToClass(LabLocationEntity, {
        lab,
        address: {
          street: [
            this.getAddressComponent(AddressType.street_address, place)?.short_name,
            this.getAddressComponent(AddressType.route, place)?.short_name,
          ]
            .filter(Boolean)
            .join(' '),
          unit: this.getAddressComponent(AddressType.subpremise, place)?.short_name,
          city: this.getAddressComponent(AddressType.locality, place)?.short_name,
          state: this.getAddressComponent(AddressType.administrative_area_level_1, place)?.short_name,
          zipCode: this.getAddressComponent(AddressType.postal_code, place)?.short_name,
        },
        active: true,
      });

      // Certain entity elements are not exposed for writing in class-transformer, so write them separately
      // ignoreDecorators option is not working at this time: https://github.com/typestack/class-transformer/issues/152
      entity.place_id = place.place_id;
      entity.address.geo = {
        type: 'Point',
        coordinates: [place.geometry.location.lng, place.geometry.location.lat],
      };

      const e = await this.service.create(entity);

      console.log(`Successfully created lab location: ${e.lab} @ ${e.address.composed}`);
    } catch (err) {
      console.error(err.toString());
    }

    const anotherInput = await prompt<Answers>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Do you want to create another lab location?`,
        default: false,
      },
    ]);

    if (anotherInput.confirmed) {
      await this.create(null);
    }
  }

  @Command({ command: 'lab-location:load-data', describe: 'Load data from a predefined file' })
  async loadFromData() {
    for (const location of LabLocationsData) {
      const query = `${location.lab} ${location.address} ${location.city}`;
      const results = await this.mapping.places(query);

      if (!results.length) {
        console.warn(`Unable to find any results for the given query: ${query}`);
        continue;
      }

      let result = results.find((r) => (r.place_id = location.googlePlaceId));

      if (!result) {
        console.warn(`Unable to find matching place ID: ${location.googlePlaceId}`);
        const questions = await prompt<Answers>([
          {
            type: 'rawlist',
            name: 'result',
            message: 'Choose the most relevant place from the list:',
            choices: [
              ...results.map((r) => {
                return {
                  name: `${r.name} (id: ${r.place_id}) located at '${r.formatted_address}'`,
                  value: r,
                };
              }),
              {
                name: 'Skip',
                value: null,
              },
            ],
          },
        ]);

        if (!questions.result) {
          console.warn(`Skipping...`);
          continue;
        } else {
          result = questions.result;
        }
      }

      const place = await this.mapping.place(result.place_id);

      let entity;

      try {
        entity = await this.service.getRepository().findOneOrFail({
          where: {
            place_id: place.place_id,
          },
        });
        console.log(`Updating existing LabLocation: ${entity.id}`);
      } catch (e) {
        if (e instanceof EntityNotFoundError) {
          console.log(`Creating new LabLocation...`);
          entity = new LabLocationEntity();
        } else {
          throw e;
        }
      }

      entity = this.updateEntity(this.determineLabCompany(location.lab), entity, place);

      const services = location.servicesOffered.split('\n').filter(Boolean);
      const notes = location.notes.split('\n').filter(Boolean);

      entity.services = services.length > 0 ? services : null;
      entity.notes = notes.length > 0 ? notes : null;

      await this.service.validate(entity);

      await this.service.getRepository().save(entity);
      console.log(`Done!`);
    }
  }

  private determineLabCompany(lab: string): LabCompany {
    switch (slug(lab, slug.defaults.modes.rfc3986)) {
      case 'labcorp':
      case 'lab-corp':
        return LabCompany.Labcorp;
      case 'quest':
      case 'quest-diagnostics':
        return LabCompany.QuestDiagnostics;
      case 'sonora-quest':
        return LabCompany.SonoraQuest;
      case 'labxpress':
      case 'lab-xpress':
        return LabCompany.LabXpress;
      default:
        throw new Error(`Unable to determine lab company from string: ${lab}`);
    }
  }

  private updateEntity(lab: LabCompany, entity: LabLocationEntity, place: Place): LabLocationEntity {
    const e = plainToClassFromExist(entity, {
      lab,
      address: {
        street: [
          this.getAddressComponent(AddressType.street_address, place)?.short_name,
          this.getAddressComponent(AddressType.route, place)?.short_name,
        ]
          .filter(Boolean)
          .join(' '),
        unit: this.getAddressComponent(AddressType.subpremise, place)?.short_name,
        city: this.getAddressComponent(AddressType.locality, place)?.short_name,
        state: this.getAddressComponent(AddressType.administrative_area_level_1, place)?.short_name,
        zipCode: this.getAddressComponent(AddressType.postal_code, place)?.short_name,
      },
      active: true,
    });

    // Certain entity elements are not exposed for writing in class-transformer, so write them separately
    // ignoreDecorators option is not working at this time: https://github.com/typestack/class-transformer/issues/152
    e.place_id = place.place_id;
    e.address.geo = {
      type: 'Point',
      coordinates: [place.geometry.location.lng, place.geometry.location.lat],
    };

    return e;
  }

  private async ask(query: string): Promise<[LabCompany, Place]> {
    do {
      const queryInput = await prompt<Answers>([
        {
          type: 'input',
          name: 'query',
          message: 'Enter the query to search for:',
          default: query,
          when: () => !query,
        },
      ]);

      const results = await this.mapping.places(query || queryInput.query);

      if (!results.length) {
        console.warn(`Unable to find any results for the given query: ${query}`);
        query = null;
        continue;
      }

      const questions = await prompt<Answers>([
        {
          type: 'rawlist',
          name: 'result',
          message: 'Choose the most relevant place from the list:',
          choices: results.map((r) => {
            return {
              name: `${r.name} (id: ${r.place_id}) located at '${r.formatted_address}'`,
              value: r,
            };
          }),
        },
        {
          type: 'list',
          name: 'lab',
          message: 'Which company does this lab belong to?',
          choices: enumKeys(LabCompany).map((k) => {
            return {
              name: startCase(k),
              value: LabCompany[k],
            };
          }),
        },
      ]);

      const result = await this.mapping.place(questions.result.place_id);

      return [questions.lab, result];
    } while (true);
  }

  private getAddressComponent(component: AddressType | GeocodingAddressComponentType, result: Place): AddressComponent {
    return result.address_components.find((comp) => comp.types.includes(component));
  }
}
