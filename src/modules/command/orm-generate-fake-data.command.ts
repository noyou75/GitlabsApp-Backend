import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import * as faker from 'faker';
import { getRepository } from 'typeorm';
import { PatientUser } from '../../entities/user.entity';
import { Command } from './command.decorator';
import { ConfigService } from '../core/services/config.service';

@Injectable()
export class OrmGenerateFakeDataCommand {
  constructor(public readonly config: ConfigService) {}

  @Command({ command: 'orm:generate:fake-data', describe: 'Load database with fake data' })
  async run() {
    if (this.config.isProduction()) {
      throw new Error('!!! This command cannot be run in production !!!');
    }

    const patients: PatientUser[] = [];

    for (let i = 0; i < 250; i++) {
      const fName = faker.name.firstName();
      const lName = faker.name.lastName();

      patients.push(
        plainToClass(PatientUser, {
          name: `${fName} ${lName}`,
          email: faker.internet.exampleEmail(fName, lName),
          phoneNumber: faker.phone.phoneNumber('###-###-####'),
          address: {
            street: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.stateAbbr(),
            zipCode: faker.address.zipCode('#####'),
          },
          createdAt: faker.date.recent(90),
        }),
      );
    }

    await getRepository(PatientUser).save(patients);
  }
}
