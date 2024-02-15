import { Command, Positional, CommandMetadata, CommandParamMetadata, CommandPositionalOption, Optional } from './command.decorator';

describe('@Command', () => {
  class TestClass {
    @Command({ command: 'command', describe: 'description' })
    public static command() {}

    @Command({ command: 'commandWithParameters <param>', describe: 'description' })
    public static commandWithParameters(
      @Positional({
        name: 'param',
        describe: 'description of param',
      })
      param: string,
      @Optional({
        name: 'option',
        describe: 'description of option',
        type: 'boolean',
      })
      option: boolean,
    ) {}
  }

  it('should enhance method with command metadata', () => {
    const metadata = Reflect.getMetadata('__command-handler-metadata__', TestClass.command);
    expect(metadata).toEqual({ option: { command: 'command', describe: 'description' } } as CommandMetadata);
  });

  it('should enhance method with command metadata and parameters metadata', () => {
    const metadata = Reflect.getMetadata('__command-handler-metadata__', TestClass.commandWithParameters);
    expect(metadata).toMatchObject({
      option: { command: 'commandWithParameters <param>', describe: 'description' },
      params: {
        /* Test params through args metadata below*/
      },
    } as CommandMetadata);

    const params = Reflect.getMetadata('__command-args-metadata__', TestClass.commandWithParameters);
    expect(params).toMatchObject({
      positional: [{ option: { name: 'param', describe: 'description of param' } }],
      option: [{ option: { name: 'option', describe: 'description of option', type: 'boolean' } }],
    } as CommandParamMetadata<CommandPositionalOption>);
  });
});
