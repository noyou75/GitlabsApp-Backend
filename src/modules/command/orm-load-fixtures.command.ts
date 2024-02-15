import { Injectable } from '@nestjs/common';
import { rootDir } from '../../root';
import { FixturesService } from '../core/services/fixtures.service';
import { Command } from './command.decorator';

@Injectable()
export class OrmLoadFixturesCommand {
  constructor(public readonly service: FixturesService) {}

  @Command({ command: 'orm:fixtures:load', describe: 'Load database fixtures' })
  async run() {
    await this.service.load(`${rootDir}/fixtures`);
  }
}
