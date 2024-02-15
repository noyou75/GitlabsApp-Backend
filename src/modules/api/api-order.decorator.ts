import { SetMetadata } from '@nestjs/common';

export interface ApiOrderOptions {
  properties: string[];
  paramName?: string;
}

export const ApiOrder = (properties: string[], paramName?: string) =>
  SetMetadata('api-order', { properties, paramName } as ApiOrderOptions);
