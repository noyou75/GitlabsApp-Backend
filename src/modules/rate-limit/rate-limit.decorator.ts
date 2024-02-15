import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_METADATA } from './rate-limit.module';
import { Response, Request } from 'express';

export interface RateLimitOptions {
  interval: number; // In seconds
  limit: number;
  key?: (req: Request, res: Response) => string;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_METADATA, options);
