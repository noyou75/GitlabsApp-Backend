import { Body, Controller, Get, HttpCode, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreditEntity } from '../../entities/credit.entity';
import { PatientUser } from '../../entities/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ConvertToEntity } from '../shared/decorators/convert-to-entity.decorator';
import { ParameterValidationInterceptor } from '../shared/interceptors/parameter-validation.interceptor';
import { CreditAdjustmentDto } from './dto/credit-adjustment.dto';
import { CreditBalanceDto } from './dto/credit-balance.dto';
import { IssueCreditDto } from './dto/issue-credit.dto';
import { PatientCreditService } from './patient-credit.service';

@Controller('patient-credit')
@UseInterceptors(ParameterValidationInterceptor)
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PatientCreditController {
  constructor(private readonly patientCreditService: PatientCreditService) {}

  @Get(':id')
  @Roles(UserRole.Staff, UserRole.Patient)
  async getBalance(@ConvertToEntity() entity: PatientUser): Promise<CreditBalanceDto> {
    return plainToClass(CreditBalanceDto, {
      balance: this.patientCreditService.getBalance(entity),
    });
  }

  @Post(':id/issue-credit')
  @Roles(UserRole.Staff)
  async issueCredit(@ConvertToEntity() entity: PatientUser, @Body() issueCreditDto: IssueCreditDto): Promise<CreditEntity> {
    return this.patientCreditService.issueCredit(entity, issueCreditDto.amount, issueCreditDto.source, {
      validDateRange: issueCreditDto.validDateRange,
      notes: issueCreditDto.notes,
    });
  }

  @Post(':id/revoke-credit')
  @Roles(UserRole.Staff)
  @HttpCode(204)
  async revokeCredit(@ConvertToEntity() entity: PatientUser, @Body() creditAdjustmentDto: CreditAdjustmentDto) {
    await this.patientCreditService.revokeCredit(entity, creditAdjustmentDto.amount);
  }

  @Post(':id/refund-credit')
  @Roles(UserRole.Staff)
  @HttpCode(204)
  async refundCredit(@ConvertToEntity() entity: PatientUser, @Body() creditAdjustmentDto: CreditAdjustmentDto) {
    await this.patientCreditService.refundCredit(entity, creditAdjustmentDto.amount);
  }
}
