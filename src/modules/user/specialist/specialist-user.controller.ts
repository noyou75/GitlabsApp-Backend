import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SpecialistUser } from '../../../entities/user.entity';
import { RolesGuard } from '../../auth/roles.guard';
import { UserController } from '../user.controller';
import { SpecialistUserService } from './specialist-user.service';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ConvertToEntity } from '../../shared/decorators/convert-to-entity.decorator';
import { MarketEntity } from '../../../entities/market.entity';
import { MarketsAssignDto } from '../dto/markets-assign.dto';

@Controller('user/specialist')
@UseGuards(AuthGuard(), RolesGuard)
export class SpecialistUserController extends UserController(SpecialistUser, SpecialistUserService) {
  @Post(':id/markets')
  @Roles(UserRole.AdminStaff)
  async updateMarkets(
    @ConvertToEntity({ type: SpecialistUser }) entity: SpecialistUser,
    @Body() dto: MarketsAssignDto,
  ): Promise<MarketEntity[]> {
    return await this.service.setMarkets(entity, dto.marketIds);
  }
}
