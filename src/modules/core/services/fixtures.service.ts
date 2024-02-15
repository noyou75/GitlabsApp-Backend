import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { readFileSync } from 'fs';
import glob from 'glob-promise';
import path from 'path';
import { Connection } from 'typeorm';
import { ClassType } from '../../../common/class.utils';

@Injectable()
export class FixturesService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getAllEntities() {
    return this.connection.entityMetadatas.map(e => e.target).filter(e => e instanceof Function);
  }

  getEntities(classes?: ClassType<any>[]): any[] {
    if (classes.length) {
      return classes;
    }
    return this.getAllEntities();
  }

  async load(folder: string, ...classes: ClassType<any>[]) {
    const entities = this.getEntities(classes);

    for (const entity of entities) {
      const repository = this.connection.getRepository(entity);
      const fixtureFile = path.join(folder, '**', `${entity.name}.json`);
      for (const file of await glob(fixtureFile)) {
        const data = JSON.parse(readFileSync(file, 'utf8'));
        await repository
          .createQueryBuilder(entity.name)
          .insert()
          .values(plainToClass(entity, data))
          .execute()
          .catch(e => {
            throw e;
          });
      }
    }
  }

  async clean(...classes: ClassType<any>[]) {
    try {
      const entities = this.getEntities(classes);
      for (const entity of entities) {
        await this.connection.getRepository(entity).clear();
      }
    } catch (err) {
      throw new Error(`Unable to clean database: ${err}`);
    }
  }

  async reload(folder: string, ...classes: ClassType<any>[]) {
    await this.clean(...classes);
    await this.load(folder, ...classes);
  }
}
