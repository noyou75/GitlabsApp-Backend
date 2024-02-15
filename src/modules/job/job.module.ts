import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { RedisConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        return {
          redis: config.get(RedisConfig.URL),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class JobModule {}
