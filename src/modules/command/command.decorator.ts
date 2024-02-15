import { SetMetadata } from '@nestjs/common';
import { Options, PositionalOptions } from 'yargs';
import { CommandParamType } from './enums/command-param-type.enum';

export function Command(option: CommandOption): MethodDecorator {
  return (target: object, key: string | symbol, descriptor: PropertyDescriptor) => {
    const metadata: CommandMetadata = {
      params: Reflect.getMetadata(COMMAND_ARGS_METADATA, descriptor.value),
      option,
    };

    SetMetadata(COMMAND_HANDLER_METADATA, metadata)(target, key, descriptor);
  };
}

export const COMMAND_HANDLER_METADATA = '__command-handler-metadata__';
export const COMMAND_ARGS_METADATA = '__command-args-metadata__';

export interface CommandMetadata {
  params: any;
  option: CommandOption;
}

export type CommandParamMetadata<T> = { [type in CommandParamType]: CommandParamMetadataItem<T>[] };

export interface CommandParamMetadataItem<T> {
  index: number;
  option: T;
}

export interface CommandOption {
  aliases?: string | string[];
  describe?: string;
  command: string | string[];
}

const createCommandParamDecorator = <T>(paramType: CommandParamType) => {
  return (option?: T): ParameterDecorator => (target, key, index) => {
    const params = Reflect.getMetadata(COMMAND_ARGS_METADATA, target[key]) || {};
    Reflect.defineMetadata(
      COMMAND_ARGS_METADATA,
      {
        ...params,
        [paramType]: [...(params[paramType] || []), { index, option }],
      },
      target[key],
    );
  };
};

export interface CommandPositionalOption extends PositionalOptions {
  name: string;
}

export const Positional = createCommandParamDecorator<CommandPositionalOption>(CommandParamType.Positional);

export interface CommandOptionalOption extends Options {
  name: string;
}

export const Optional = createCommandParamDecorator<CommandOptionalOption>(CommandParamType.Optional);
