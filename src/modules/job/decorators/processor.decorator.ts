import { ProcessorOptions as BullProcessorOptions } from '@nestjs/bull/dist/decorators/processor.decorator';
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Processor as BullProcessor } from '@nestjs/bull';
import { BasicConfig } from '../../core/enums/config.enum';
import validator from 'validator';
import { toBoolean } from 'validator';

export const GL_PROCESSOR_METADATA = 'gl-processor-metadata';

export enum ProcessorType {
  worker = 'worker',
  default = 'default',
}

export interface ProcessorMetadata {
  type: ProcessorType;
}

export interface ProcessorOptions extends BullProcessorOptions {
  type?: ProcessorType;
}

export function Processor();
export function Processor(queueName: string);
export function Processor(processorOptions: ProcessorOptions);
export function Processor(queueNameOrOptions?: string | ProcessorOptions) {
  const options: ProcessorOptions = typeof queueNameOrOptions === 'object' ? queueNameOrOptions : { name: queueNameOrOptions };
  /**
   * If ProcessorType is worker only listen if the sever has the QUEUE_WORKER environment variable. Or if in dev mode always listen.
   */
  if (
    process.env[BasicConfig.Environment] !== 'development' &&
    options.type === ProcessorType.worker &&
    !toBoolean(process.env[BasicConfig.QueueWorker] || 'false')
  ) {
    return () => { };
  }
  return applyDecorators(
    SetMetadata(GL_PROCESSOR_METADATA, <ProcessorMetadata>{ type: options.type || ProcessorType.default }),
    BullProcessor(options),
  );
}
