import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Brackets } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { MarketEntity } from '../../entities/market.entity';
import { CrudController } from '../api/crud/crud.controller';
import { QueryOptionsDto } from '../api/crud/query-options.dto';
import { SearchParams } from '../api/crud/search.params';
import { PagedResponseDto } from '../api/pagination/paged-response.dto';
import { PaginationOptionsDto } from '../api/pagination/pagination-options.dto';
import { AppointmentListDto } from '../appointment/dto/appointment-list.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MarketService } from './market.service';

const BaseController = CrudController(MarketEntity, MarketService, {
  query: (qb, params: AppointmentListDto) => {
    if (params.search) {
      qb.andWhere(
        new Brackets((qbWhere) => {
          qbWhere.where(`name ILIKE :search`).orWhere(`code ILIKE :search`);
        }),
      );

      qb.setParameter('search', params.search + '%');
    }
  },
});

@Controller('market')
@UseGuards(AuthGuard(), RolesGuard)
@Roles(UserRole.StaffRead, UserRole.AdminStaffWrite)
export class MarketController extends BaseController {
  @Get()
  async list(
    @Query() pagination: PaginationOptionsDto,
    @Query() crudOptions: QueryOptionsDto<MarketEntity>,
    @Query() params: SearchParams,
  ): Promise<PagedResponseDto<MarketEntity>> {
    return await super.list(pagination, crudOptions, params);
  }
}
