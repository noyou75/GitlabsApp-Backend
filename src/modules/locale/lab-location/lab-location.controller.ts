import { Body, Controller, Get, Inject, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { distanceBetweenCoordinates } from '../../../common/geo.utils';
import { LabLocationEntity } from '../../../entities/lab-location.entity';
import { QueryOptionsDto } from '../../api/crud/query-options.dto';
import { CrudController } from '../../api/crud/crud.controller';
import { PagedResponseDto } from '../../api/pagination/paged-response.dto';
import { PaginationOptionsDto } from '../../api/pagination/pagination-options.dto';
import { ConditionalAuthGuard } from '../../auth/conditional-auth.guard';
import { ExcludeAuthGuard } from '../../auth/exclude-auth-guard.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { MappingService } from '../../core/services/mapping.service';
import { LabLocationBySlugDto } from './dto/lab-location-by-slug.dto';
import { LabLocationDetailedDto } from './dto/lab-location-detailed.dto';
import { LabLocationListDto } from './dto/lab-location-list.dto';
import { LabLocationService } from './lab-location.service';
import { LabLocationByAddressDto } from './dto/lab-location-by-address.dto';
import { Brackets } from 'typeorm';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ConvertToEntity } from '../../shared/decorators/convert-to-entity.decorator';
import { MarketsAssignDto } from '../../user/dto/markets-assign.dto';
import { MarketEntity } from '../../../entities/market.entity';

@Controller('lab-location')
@UseGuards(ConditionalAuthGuard(), RolesGuard)
@Roles(UserRole.StaffRead, UserRole.AdminStaffWrite)
export class LabLocationController extends CrudController(LabLocationEntity, LabLocationService, {
  query: async (qb, params: LabLocationListDto) => {
    if (params.lab) {
      params.lab = Array.isArray(params.lab) ? params.lab : [params.lab];
      qb.where(`${qb.alias}.lab IN (:...labs)`, { labs: params.lab });
    }
    if (params.search) {
      qb.andWhere(
        new Brackets((qbWhere) => {
          qbWhere
            .where(`${qb.alias}.address_street ILIKE :search`)
            .orWhere(`${qb.alias}.address_city ILIKE :searchStartsWith`)
            .orWhere(`${qb.alias}.address_state ILIKE :searchStartsWith`)
            .orWhere(`${qb.alias}.address_zip_code ILIKE :searchStartsWith`);
        }),
      );

      qb.setParameter('searchStartsWith', params.search + '%');
      qb.setParameter('search', '%' + params.search + '%');
    }

    if (params.coordinates) {
      // For geodetic coordinates, X is longitude and Y is latitude:
      //  geometry ST_MakePoint(float x, float y)

      // The following code breaks typeorm 0.2.x, but should be fixed once 0.3 is released
      // qb.addSelect(`${qb.alias}.address.geo <-> st_makepoint(:long, :lat)::geometry as distance`);
      // qb.orderBy('distance', 'ASC');

      qb.andWhere(`${qb.alias}.address.geo IS NOT NULL`);
      qb.andWhere(`${qb.alias}.active = true`);
      qb.andWhere(`${qb.alias}.public = true`);
      qb.orderBy(`ST_Distance(${qb.alias}.address.geo, ST_MakePoint(:long, :lat)::geometry)`, 'ASC');
      qb.setParameters({
        lat: params.coordinates[0],
        long: params.coordinates[1],
      });
    } else {
      qb.orderBy(`${qb.alias}.lab`, 'ASC');
    }
  },
}) {
  @Inject()
  maps: MappingService;

  @Get()
  @ExcludeAuthGuard()
  async list(
    @Query() pagination: PaginationOptionsDto,
    @Query() crudOptions: QueryOptionsDto<LabLocationEntity>,
    @Query() params: LabLocationListDto,
  ): Promise<PagedResponseDto<LabLocationEntity>> {
    // Do not load the relations when there are coordinates, as this requests are ordered by ST_Distance and this combination triggers a bug in TypeORM
    // https://github.com/typeorm/typeorm/issues/2817
    const results = await super.list(pagination, crudOptions, params, true, { ignoreEagerRelations: !!params.coordinates });
    if (params.coordinates) {
      results.data.map((entity: LabLocationEntity) => {
        entity.address.distance = distanceBetweenCoordinates(entity.address.geo.coordinates.slice().reverse(), params.coordinates);
      });
    }

    return results;
  }

  @Get('address/:zipCode/:street?')
  @ExcludeAuthGuard()
  async listByAddress(@Param() params: LabLocationByAddressDto): Promise<PagedResponseDto<LabLocationEntity>> {
    const labs = await this.service.getLabLocationsByAddress(params.zipCode, params.street, true);
    return {
      data: labs,
      total: labs.length,
    };
  }

  @Get(':lab/:slug')
  @ExcludeAuthGuard()
  async readBySlug(@Param() params: LabLocationBySlugDto): Promise<LabLocationDetailedDto> {
    try {
      const entity = await this.service.getRepository().findOneOrFail({
        where: {
          lab: params.lab,
          slug: params.slug,
        },
      });
      return new LabLocationDetailedDto(entity, await this.maps.place(entity.place_id));
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException();
      }
      throw e;
    }
  }

  @Post(':id/markets')
  @Roles(UserRole.AdminStaff)
  async updateMarkets(
    @ConvertToEntity({ type: LabLocationEntity }) entity: LabLocationEntity,
    @Body() dto: MarketsAssignDto,
  ): Promise<MarketEntity[]> {
    return await this.service.setMarkets(entity, dto.marketIds);
  }
}
