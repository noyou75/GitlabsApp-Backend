import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AnonymousStrategy } from './anonymous/anonymous.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { ConfigService } from '../core/services/config.service';
import { NotificationModule } from '../notification/notification.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    SharedModule,
    NotificationModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('SECRET'),
        signOptions: {
          algorithm: 'HS512',
          expiresIn: 86400,
        },
      }),
      inject: [ConfigService],
    }),
    RateLimitModule,
    forwardRef(() => UserModule),
    AnalyticsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AnonymousStrategy],
  exports: [AuthService],
})
export class AuthModule {}
