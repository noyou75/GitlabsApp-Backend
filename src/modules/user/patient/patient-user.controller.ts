import { Controller, Get, HttpCode, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { PatientUser } from '../../../entities/user.entity';
import { PagedResponseDto } from '../../api/pagination/paged-response.dto';
import { PaginationOptionsDto } from '../../api/pagination/pagination-options.dto';
import { AppointmentService } from '../../appointment/appointment.service';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SECURITY_ATTR_LIST, SECURITY_ATTR_READ } from '../../core/security/security-voter.const';
import { ConvertToEntity } from '../../shared/decorators/convert-to-entity.decorator';
import { UserController } from '../user.controller';
import { PatientUserService } from './patient-user.service';

@Controller('user/patient')
@UseGuards(AuthGuard(), RolesGuard)
export class PatientUserController extends UserController(PatientUser, PatientUserService) {
  @Inject()
  private readonly appointmentService: AppointmentService;

  @Get(':id/appointments')
  async listAppointments(
    @ConvertToEntity() entity: PatientUser,
    @Query() pagination: PaginationOptionsDto,
  ): Promise<PagedResponseDto<AppointmentEntity>> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_READ);
    await this.appointmentService.denyAccessUnlessGranted(null, SECURITY_ATTR_LIST);
    const results = await this.appointmentService.find(
      (opts) => {
        opts.where = {
          patient: entity.id,
          rebookedTo: null,
        };
        opts.order = {
          createdAt: 'DESC',
        };
      },
      undefined,
      pagination,
    );
    await this.appointmentService.denyAccessUnlessGranted(results.data, SECURITY_ATTR_READ);
    return results;
  }

  @Post(':id/continue-insurance-on-mobile')
  @HttpCode(201)
  @Roles(UserRole.Patient)
  async continueInsuranceOnMobile(@ConvertToEntity() entity: PatientUser): Promise<void> {
    await this.service.sendContinueInsuranceOnMobileLink(entity);
  }
}
