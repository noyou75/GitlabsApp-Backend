import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { CrudController } from '../../api/crud/crud.controller';
import { QueryOptionsDto } from '../../api/crud/query-options.dto';
import { PagedResponseDto } from '../../api/pagination/paged-response.dto';
import { PaginationOptionsDto } from '../../api/pagination/pagination-options.dto';
import { ConditionalAuthGuard } from '../../auth/conditional-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { ServiceAreaListDto } from './dto/service-area-list.dto';
import { ServiceAreaService } from './service-area.service';

@Controller('service-area')
@UseGuards(ConditionalAuthGuard(), RolesGuard)
export class ServiceAreaController extends CrudController(ServiceAreaEntity, ServiceAreaService, {
  findOneOptions: {
    relations: ['market'],
  },
  query: async (qb, params: ServiceAreaListDto) => {
    if (params.market) {
      qb.where(`${qb.alias}.market = :market`, { market: params.market });
    }
  },
}) {
  @Get()
  async list(
    @Query() pagination: PaginationOptionsDto,
    @Query() crudOptions: QueryOptionsDto<ServiceAreaEntity>,
    @Query() params: ServiceAreaListDto,
  ): Promise<PagedResponseDto<ServiceAreaEntity>> {
    return await super.list(pagination, crudOptions, params);
  }
}
