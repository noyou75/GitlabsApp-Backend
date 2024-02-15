import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as envalid from 'envalid';
import path from 'path';
import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { parseDatabaseUrl } from './common/string.utils';

const env = envalid.cleanEnv(process.env, {
  DB_URL: envalid.url({ devDefault: 'postgres://postgres:admin@localhost:5432/app' }),
  DB_SSL_HOST: envalid.str({ devDefault: '' }),
  DB_SSL_CA: envalid.str({ devDefault: '' }),
  DB_SSL_KEY: envalid.str({ devDefault: '' }),
  DB_SSL_CERT: envalid.str({ devDefault: '' }),
});

class NamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return snakeCase(embeddedPrefixes.concat(customName ? customName : propertyName).join('_'));
  }
}

const db = parseDatabaseUrl(env.DB_URL);

const options: TypeOrmModuleOptions = {
  type: db.driver as any,
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.database,
  ssl: env.isProduction
    ? {
      host: env.DB_SSL_HOST,
      ca: env.DB_SSL_CA,
      key: env.DB_SSL_KEY,
      cert: env.DB_SSL_CERT,
    }
    : undefined,
  entityPrefix: 'app_',
  synchronize: false,
  logging: false,
  namingStrategy: new NamingStrategy(),
  entities: [path.resolve(__dirname, 'entities/*.entity.{ts,js}')],
  // Note: Subscribers are injected as Nest provider and must manually register
  // themselves with the connection in order to work
  // subscribers: ['src/**/*.subscriber.ts'],
  migrations: [path.resolve(__dirname, 'migrations/*.{ts,js}')],
  cli: {
    entitiesDir: '../../src/entities',
    subscribersDir: '../../src/subscribers',
    migrationsDir: '../../src/migrations',
  },
};

export default options;
