import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { RecaptchaGuard } from './recaptcha.guard';
import { RecaptchaService } from './recaptcha.service';

@Module({
  imports: [SharedModule],
  providers: [RecaptchaService, RecaptchaGuard],
  exports: [RecaptchaGuard, RecaptchaService],
})
export class RecaptchaModule {}
