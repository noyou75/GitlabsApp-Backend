import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { BasicConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { LoggerService } from '../core/services/logger.service';

@Module({})
export class DatabaseModule implements OnApplicationBootstrap {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<any> {
    // The following code blocks initialization of the application in a distributed fashion until
    // migrations are run by the first bootstrapped container to encounter them.

    // The basic premise is to acquire a psuedo lock on the database and prevent initialization of
    // the application (and therefore, readiness/liveness probes) until the migrations are completed.

    // Only auto-run migrations when configured to do so
    if (!this.config.get(BasicConfig.AutoMigrations)) {
      return;
    }

    do {
      try {
        await this.connection.query(`CREATE TABLE "_lock" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), PRIMARY KEY ("id"))`);
        this.logger.info('Database migration lock acquired!');
        break;
      } catch (e) {
        this.logger.info('Database migration lock already exists. Waiting for release...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } while (true);

    try {
      this.logger.info('Database migration starting...');
      await this.connection.runMigrations({ transaction: 'each' });
      this.logger.info('Database migration finished!');
    } catch (e) {
      // TODO: Send a notification to someone
      throw e;
    }

    // DO NOT put this bit of code in a "catch" block.
    // If there was an exception, assume the database must be fixed manually.
    await this.connection.query(`DROP TABLE "_lock"`);
  }
}
