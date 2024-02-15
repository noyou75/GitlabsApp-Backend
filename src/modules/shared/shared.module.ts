import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { IsPaymentIntentStatusConstraint } from './constraints/is-payment-intent-status.constraint';
import { IsTimezoneConstraint } from './constraints/is-timezone.constraint';
import { IsUniqueConstraint } from './constraints/is-unique.constraint';
import { ParameterValidationInterceptor } from './interceptors/parameter-validation.interceptor';
import { OperatingHoursService } from './services/operating-hours.service';
import { StringEncoderService } from './services/string-encoder.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    // Constraints
    IsTimezoneConstraint,
    IsUniqueConstraint,
    IsPaymentIntentStatusConstraint,

    // Services
    StringEncoderService,
    OperatingHoursService,

    // Interceptors
    ParameterValidationInterceptor,
  ],
  exports: [PassportModule, StringEncoderService, OperatingHoursService, ParameterValidationInterceptor],
})
export class SharedModule {}
