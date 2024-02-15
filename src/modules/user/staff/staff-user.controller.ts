import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffUser } from '../../../entities/user.entity';
import { RolesGuard } from '../../auth/roles.guard';
import { StaffUserService } from './staff-user.service';
import { UserController } from '../user.controller';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ConvertToEntity } from '../../shared/decorators/convert-to-entity.decorator';
import { MarketEntity } from '../../../entities/market.entity';
import { MarketsAssignDto } from '../dto/markets-assign.dto';

@Controller('user/staff')
@UseGuards(AuthGuard(), RolesGuard)
export class StaffUserController extends UserController(StaffUser, StaffUserService) {
  @Post(':id/markets')
  @Roles(UserRole.AdminStaff)
  async updateMarkets(@ConvertToEntity({ type: StaffUser }) entity: StaffUser, @Body() dto: MarketsAssignDto): Promise<MarketEntity[]> {
    return await this.service.setMarkets(entity, dto.marketIds);
  }
}
