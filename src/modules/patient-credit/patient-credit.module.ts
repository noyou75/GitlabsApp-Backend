import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditModule } from '../credit/credit.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { PatientCreditController } from './patient-credit.controller';
import { PatientCreditService } from './patient-credit.service';

@Module({
  imports: [PatientUserModule, CreditModule, AuthModule],
  controllers: [PatientCreditController],
  providers: [PatientCreditService],
  exports: [PatientCreditService],
})
export class PatientCreditModule { }
