import { Delete, Get, HttpCode, Inject, Patch, Post, Query, Type } from '@nestjs/common';
import { Connection, FindManyOptions, FindOneOptions, SelectQueryBuilder, DeepPartial } from 'typeorm';
import { AnalyticsContext } from '../../analytics/context/analytics.context';
import {
  SECURITY_ATTR_CREATE,
  SECURITY_ATTR_LIST,
  SECURITY_ATTR_MODIFY,
  SECURITY_ATTR_READ,
  SECURITY_ATTR_REMOVE,
} from '../../core/security/security-voter.const';
import { ConvertToEntity } from '../../shared/decorators/convert-to-entity.decorator';
import { TransformBody } from '../../shared/decorators/transform-body.decorator';
import { PagedResponseDto } from '../pagination/paged-response.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { QueryOptionsDto } from './query-options.dto';
import { CrudServiceQueryOptions, ICrudService } from './crud.service';

export interface ICrudController<E, S extends ICrudService<E, any>> {
  service: S;

  create(data: E, skipAuthorizationCheck?: boolean): Promise<E>;

  list(
    query: PaginationOptionsDto,
    crudOptions: QueryOptionsDto<E>,
    params?: unknown,
    skipAuthorizationCheck?: boolean,
    queryOptions?: CrudServiceQueryOptions<E>,
  ): Promise<PagedResponseDto<E>>;

  read(entityOrId: string | number | E, skipAuthorizationCheck?: boolean): Promise<E>;

  update(entityOrId: string | number | E, data: E, skipAuthorizationCheck?: boolean): Promise<E>;

  delete(entityOrId: string | number | E, skipAuthorizationCheck?: boolean): void;
}

export interface ICrudControllerOptions<E, S extends ICrudService<E, any>> {
  query?: (qb: SelectQueryBuilder<E>, params: unknown, s: S) => void;
  find?: (opts: FindManyOptions<E>, params: unknown, s: S) => void;
  findOneOptions?: FindOneOptions<E>;
}

export function CrudController<E, S extends ICrudService<E, any>>(
  target: Type<E>,
  service: Type<S>,
  options?: ICrudControllerOptions<E, S>,
): Type<ICrudController<E, S>> {
  const findOneOptions = options ? options.findOneOptions : undefined;

  class CrudControllerHost {
    @Inject(service)
    public readonly service: S;

    @Inject()
    private readonly connection: Connection

    @Inject()
    protected readonly analyticsContext: AnalyticsContext;

    @Post()
    @HttpCode(201)
    async create(@TransformBody({ type: target }) data: E, skipAuthorizationCheck?: boolean): Promise<E> {
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted(data, SECURITY_ATTR_CREATE));
      return this.service.create(data as DeepPartial<E>, true, this.analyticsContext.getAnalyticsToken());
    }

    @Get()
    async list(
      @Query() pagination: PaginationOptionsDto,
      @Query() crudOptions: QueryOptionsDto<E>,
      params?: unknown,
      skipAuthorizationCheck?: boolean,
      queryOptions: CrudServiceQueryOptions<E> = {}
    ): Promise<PagedResponseDto<E>> {
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted(null, SECURITY_ATTR_LIST));
      queryOptions.filters = crudOptions?.filters;
      const results = await this.service.query(options ? options.query : undefined, params, pagination, queryOptions);
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted(results.data, SECURITY_ATTR_READ));
      return results;
    }

    @Get(':id')
    async read(@ConvertToEntity({ type: target, findOneOptions }) entity: E, skipAuthorizationCheck?: boolean): Promise<E> {
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_READ));
      return entity;
    }

    @Patch(':id')
    async update(
      @ConvertToEntity({ type: target, findOneOptions }) entity: E,
      @TransformBody({ type: target }) data: E,
      skipAuthorizationCheck?: boolean,
    ): Promise<E> {
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY));
      // merge the entities primary keys into the passed data object so they can be used in the voters
      const idMap = this.connection.getMetadata(target).getEntityIdMap(entity);
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted({ ...idMap, ...data }, SECURITY_ATTR_READ, true));
      return this.service.update(entity, data as DeepPartial<E>, this.analyticsContext.getAnalyticsToken());
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(@ConvertToEntity({ type: target, findOneOptions }) entity: E, skipAuthorizationCheck?: boolean): Promise<void> {
      skipAuthorizationCheck || (await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_REMOVE));
      await this.service.delete(entity, this.analyticsContext.getAnalyticsToken());
    }
  }

  return CrudControllerHost;
}
