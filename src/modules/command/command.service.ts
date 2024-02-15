import { Injectable, OnModuleInit } from '@nestjs/common';
import { Injectable as InjectableInterface } from '@nestjs/common/interfaces';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { each, flattenDeep } from 'lodash';
import { Argv, CommandModule } from 'yargs';
import { SentryService } from '../core/services/sentry.service';

import {
  COMMAND_HANDLER_METADATA,
  CommandMetadata,
  CommandOptionalOption,
  CommandParamMetadata,
  CommandParamMetadataItem,
  CommandPositionalOption,
} from './command.decorator';
import { CommandParamType } from './enums/command-param-type.enum';

@Injectable()
export class CommandService implements OnModuleInit {
  private _yargs?: Argv;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly sentry: SentryService,
  ) {}

  onModuleInit() {
    this.init(this.buildCommands());
  }

  private buildCommands(): CommandModule[] {
    const components = [...this.modulesContainer.values()].map(module => module.components);
    return flattenDeep<CommandModule>(
      components.map(component =>
        [...component.values()].map(({ instance, metatype }) => (instance ? this.filterCommands(instance, metatype) : [])),
      ),
    );
  }

  private filterCommands(instance: InjectableInterface, metatype: any): CommandModule[] {
    const prototype = Object.getPrototypeOf(instance);
    const components = this.metadataScanner.scanFromPrototype(instance, prototype, name => this.extractMetadata(instance, prototype, name));

    return components
      .filter(component => !!component.metadata)
      .map<CommandModule>(component => {
        const exec = instance[component.methodName].bind(instance);

        const builder = (yargs: Argv) => {
          return this.generateCommandBuilder(component.metadata.params, yargs);
        };

        const handler = async (argv: any) => {
          const params = this.generateCommandParams(component.metadata.params, argv);
          this.exit((await exec(...params)) || 0);
        };

        return {
          ...component.metadata.option,
          builder,
          handler,
        };
      });
  }

  private extractMetadata(instance, prototype, methodName: string) {
    const callback = prototype[methodName];
    const metadata: CommandMetadata = Reflect.getMetadata(COMMAND_HANDLER_METADATA, callback);
    return { methodName, metadata };
  }

  private iterateParamMetadata<T>(params: CommandParamMetadata<T>, callback: (item: CommandParamMetadataItem<T>, key: string) => void) {
    each(params, (param, key) => {
      each(param, metadata => callback(metadata, key));
    });
  }

  private generateCommandBuilder(params: CommandParamMetadata<CommandOptionalOption | CommandPositionalOption>, yargs: Argv): Argv {
    this.iterateParamMetadata(params, (item, key) => {
      switch (key) {
        case CommandParamType.Optional:
          yargs.option((item.option as CommandOptionalOption).name, item.option as CommandOptionalOption);
          break;
        case CommandParamType.Positional:
          yargs.positional((item.option as CommandPositionalOption).name, item.option as CommandPositionalOption);
          break;
      }
    });
    return yargs;
  }

  private generateCommandParams(params: CommandParamMetadata<CommandOptionalOption | CommandPositionalOption>, argv: any): any[] {
    const list = [];
    this.iterateParamMetadata(params, (item, key) => {
      switch (key) {
        case CommandParamType.Optional:
          list[item.index] = argv[(item.option as CommandOptionalOption).name];
          break;
        case CommandParamType.Positional:
          list[item.index] = argv[(item.option as CommandPositionalOption).name];
          break;
        case CommandParamType.Argv:
          list[item.index] = argv;
          break;
      }
    });
    return list;
  }

  get yargs() {
    if (this._yargs === undefined) {
      this._yargs = require('yargs');
    }
    return this._yargs;
  }

  init(commands: CommandModule[]) {
    this.yargs.scriptName('');
    commands.forEach(command => {
      this.yargs.command(command);
    });
  }

  exec() {
    this.yargs.demandCommand(1);
    this.yargs
      .help('h')
      .alias('h', 'help')
      .alias('v', 'version')
      .fail((msg, err) => {
        if (err) {
          console.error(err);
          this.sentry.client().captureException(err);
          this.sentry
            .client()
            .flush(10000)
            .finally(() => process.exit(1));
        } else {
          console.error(msg);
          process.exit(1);
        }
      })
      .parse();
  }

  exit(code?: number) {
    process.exit(code);
  }
}
