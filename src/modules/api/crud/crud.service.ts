import { BadRequestException, ForbiddenException, Inject, NotFoundException, Optional, Type } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { defaultMetadataStorage } from 'class-transformer/storage';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { castArray, cloneDeep, differenceWith, intersection } from 'lodash';
import {
  Brackets,
  DeepPartial,
  FindManyOptions,
  FindOptionsUtils,
  getCustomRepository,
  getRepository,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { EmbeddedMetadata } from 'typeorm/metadata/EmbeddedMetadata';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';
import { className } from '../../../common/class.utils';
import { UserRole } from '../../../common/enums/user-role.enum';
import { REQUEST_CONTEXT_MARKETS, REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { isAdministrator } from '../../../common/user.utils';
import { MarketEntity } from '../../../entities/market.entity';
import { StaffUser, User } from '../../../entities/user.entity';
import { EntityAnalyticsManagerProvider } from '../../analytics/providers/analytics-manager.provider';
import { IEntityAnalyticsManager } from '../../analytics/types/abstract-entity-analytics.manager';
import { SecurityVoterService } from '../../core/services/security-voter.service';
import { MarketFilterableOptionsMetadataKey } from '../../market/decorator/market.decorator';
import { FilterableManager } from '../../shared/decorators/filterable.decorator';
import { isPrimitiveType } from '../../shared/util/type.util';
import { PagedResponseDto } from '../pagination/paged-response.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { CrudFilter, CrudFilterFieldDefinition } from './query-options.dto';

export interface CrudServiceQueryOptions<T> {
  alias?: string;
  filters?: CrudFilter<T>;
  ignoreEagerRelations?: boolean;
}

export interface ICrudService<E, R extends Repository<E>> {
  target: Type<E>;

  create(entity: DeepPartial<E>, track?: boolean, analyticsToken?: string): E | Promise<E>;

  read(id: string | number): Promise<E>;

  query(
    cb: (qb: SelectQueryBuilder<E>, p: unknown, s: ICrudService<E, R>) => void,
    params?: unknown,
    paginationOptions?: PaginationOptionsDto,
    queryOptions?: CrudServiceQueryOptions<E>,
  ): Promise<PagedResponseDto<E>>;

  find(
    cb?: (opts: FindManyOptions<E>, p: unknown, s: ICrudService<E, R>) => void,
    params?: unknown,
    paginationOptions?: PaginationOptionsDto,
  ): Promise<PagedResponseDto<E>>;

  update(entity: E, changes?: DeepPartial<E>, analyticsToken?: string): Promise<E>;

  delete(entity: E, analyticsToken?: string): Promise<E>;

  denyAccessUnlessGranted(entity: E | E[], attrs: string | string[], deep?: boolean): void;

  getRepository(): Repository<E>;

  validate(entity: unknown, returnErrors?: boolean): Promise<ValidationError[]>;
}

export interface ICrudServiceOptions {
  preserveOrphans?: boolean;
}

export function CrudService<E, R extends Repository<E>>(
  target: Type<E>,
  repository?: Type<R>,
  options?: ICrudServiceOptions,
): Type<ICrudService<E, R>> {
  options = options ?? {};

  class CrudServiceHost {
    @Inject()
    private readonly security: SecurityVoterService;

    /**
     * Analytics managers are entirely optional; if they are desired, they must be implemented as a class,
     * and decorated with the @AnalyticsManager decorator.
     */
    @Optional()
    @Inject(EntityAnalyticsManagerProvider.getAnalyticsManagerToken(target))
    protected readonly analyticsManager: IEntityAnalyticsManager<E>;

    target = target;

    async create(data: DeepPartial<E>, track = true): Promise<E> {
      const r = await this.save(data);

      /* Track the create event via the analytics manager */
      track && this.analyticsManager?.trackCreate(r);

      return r;
    }

    async read(id: string | number): Promise<E> {
      if (!id) {
        throw new BadRequestException();
      }
      try {
        return await this.getRepository().findOneOrFail(id);
      } catch (err) {
        throw new NotFoundException();
      }
    }

    async query(
      cb?: (qb: SelectQueryBuilder<E>, p: unknown, s: ICrudService<E, R>) => void,
      params?: unknown,
      paginationOptions?: PaginationOptionsDto,
      queryOptions?: CrudServiceQueryOptions<E>,
    ): Promise<PagedResponseDto<E>> {
      const qb = this.getRepository().createQueryBuilder(queryOptions?.alias);

      if (!queryOptions?.ignoreEagerRelations) {
        FindOptionsUtils.joinEagerRelations(qb, qb.alias, this.getRepository().metadata);
      }

      if (paginationOptions) {
        qb.skip(paginationOptions.offset);
        qb.take(paginationOptions.limit);
      }

      if (cb && typeof cb === 'function') {
        cb(qb, params || {}, this);
      }

      /* Apply filters */
      if (queryOptions?.filters) {
        /* Internal method that recursively populates a DB query (via querybuilder) according to the supplied
         * filter object and related entity / embedded object hierarchy. */
        const __populateQuery = async (
          crudFilter: CrudFilter<any>,
          subobjectHierarchy: (ColumnMetadata | RelationMetadata | EmbeddedMetadata)[] = [],
        ) => {
          const targetTypeMetadata = subobjectHierarchy.length && subobjectHierarchy[subobjectHierarchy.length - 1];
          const targetType = (targetTypeMetadata?.type as Type<any>) || target;

          const filterKeys = Object.keys(crudFilter);

          /* Evaluate each property set in the supplied crudFilter object.  Each set property's value(s) will be included
           * in the resulting select query (via QueryBuilder) */
          for (const filterKey of filterKeys) {
            const columnMetadata = FilterableManager.getFilterableColumnMetadata(
              targetType,
              filterKey,
              targetTypeMetadata instanceof EmbeddedMetadata ? targetTypeMetadata : null,
            );
            const whereConditions: { where: string; param: { key: string; value: string } }[] = [];

            /* Before proceeding, ensure that the value is queryable. */
            /* JSON / JSONB columns are presently not supported :( */
            if (
              !columnMetadata ||
              (typeof columnMetadata.type === 'string' && columnMetadata.type.includes('json')) ||
              !this.isExposed(filterKey, targetType)
            ) {
              /* If a given key is not queryable, simply strip it from the resulting filter object. */
              continue;
            }

            /* Coerce the supplied filter values into an array, if it's not already defined as one. */
            const filterVals = castArray(crudFilter[filterKey]);

            for (const filterVal of filterVals) {
              /* If the filter value is an object (and not an array), that means we will need to recurse into this value in order to
               * form a cohesive query, as the value mapped to this filter is a related object. */
              if (
                !isPrimitiveType(columnMetadata.type) &&
                columnMetadata.type !== targetType &&
                typeof filterVal !== 'string' &&
                typeof filterVal !== 'boolean'
              ) {
                /* If the interrogated filter value is not an object, throw an exception.  Strings are also permitted, as they will be
                 * used as a shorthand manner of indicating IDs. */
                if (!this.isCrudFilterObject(filterVal)) {
                  throw new BadRequestException(
                    `Cannot process filters for field ${filterKey}; the column for this data on ` +
                    `entity ${target.name} indicates that it is a relation.`,
                  );
                }

                /* Need to determine if this filter value requires a table join to resolve the supplied data... */
                await __populateQuery(filterVal, subobjectHierarchy.concat([columnMetadata]));
                continue;
              }

              /* Finally, before we augment the resulting filter's details, we will need to decide whether or not the filter value can be
               * considered valid.  If they are not valid, we will need to throw an exception (handled by the below-invoked validate
               * method). */
              await this.validate(
                {
                  [filterKey]: filterVal,
                },
                false,
                {
                  skipUndefinedProperties: true,
                  isPartial: true,
                  type: targetType,
                },
              );

              /* Add the resulting condition to the set of where conditions we will apply for this property / embedded property */
              /* Construct the condition portion of the query, contingent on whether or not the paramVal is a boolean. */
              let condition = `IS ${filterVal ? ' NOT' : ''} NULL`;
              let param = null;

              /* If it's not a boolean, or the column is intended to be a boolean value, we will need to morph the condition to use a
               * parameterization-based approach. */
              if (typeof filterVal !== 'boolean' || columnMetadata.type === 'boolean' || columnMetadata.type === Boolean) {
                const key = `${targetType.name}_${filterKey}_${whereConditions.length.toString(10)}`;

                condition = `= :${key}`;
                param = { key, value: filterVal };
              }

              whereConditions.push({
                where: `${[qb.alias, ...subobjectHierarchy].reduce((collector, aliasOrMetadata) => {
                  const propName = typeof aliasOrMetadata !== 'string' ? aliasOrMetadata.propertyName : aliasOrMetadata;
                  collector = !collector ? propName : `${collector}${aliasOrMetadata instanceof EmbeddedMetadata ? '.' : '_'}${propName}`;
                  return collector;
                }, '')}${targetTypeMetadata instanceof EmbeddedMetadata ? '_' : '.'}${filterKey} ${condition}`,
                param,
              });
            }

            /* If the above value vetting process identified properties we can apply to the resulting query, we need to append those
             * values to the resulting query. */
            if (whereConditions.length) {
              qb.andWhere(
                new Brackets((whereBuilder) => {
                  whereConditions.forEach((whereCondition, idx) => {
                    /* Attach each condition to the resulting query in a standard 'where' or 'or where' clause, depending on whether or not
                     * we are dealing with the first element. */
                    const method = idx === 0 ? whereBuilder.where : whereBuilder.orWhere;
                    method.call(whereBuilder, whereCondition.where);

                    if (whereCondition.param) {
                      qb.setParameter(whereCondition.param.key, whereCondition.param.value);
                    }
                  });
                }),
              );
            }
          }
        };

        await __populateQuery(queryOptions?.filters);
      }

      // TODO: Update this once admin users are assignable to markets
      const marketFilterable = Reflect.getMetadata(MarketFilterableOptionsMetadataKey, this.target);
      if (marketFilterable) {
        const markets = await this.getFilteredMarkets();
        if (markets && markets.length > 0) {
          marketFilterable.query(qb, markets);
        }
      }

      return new PagedResponseDto(...(await qb.getManyAndCount()));
    }

    async find(
      cb?: (opts: FindManyOptions<E>, p: unknown, s: ICrudService<E, R>) => void,
      params?: unknown,
      paginationOptions?: PaginationOptionsDto,
    ): Promise<PagedResponseDto<E>> {
      const opts = {} as FindManyOptions<E>;

      if (paginationOptions) {
        opts.skip = paginationOptions.offset;
        opts.take = paginationOptions.limit;
      }

      if (cb && typeof cb === 'function') {
        cb(opts, params || {}, this);
      }

      // Typecast to Repository<any> to prevent "error TS2321: Excessive stack depth comparing types 'any' and 'FindConditions<E>'"
      // See: https://github.com/Microsoft/TypeScript/issues/21592

      return new PagedResponseDto<E>(...(await (this.getRepository() as Repository<any>).findAndCount(opts)));
    }

    async update(entity: E, changes?: DeepPartial<E>): Promise<E> {
      const old = cloneDeep(entity);

      // TODO: This should probably just merge in the entity identifiers instead of merging the changes in to the whole entity.
      //  This is causing an issue with https://app.clickup.com/t/nb6nd7, but modifying this method touches a lot of moving parts
      //  and requires heavy testing.

      entity = this.getRepository().merge(entity, changes);
      const r = await this.save(entity as DeepPartial<E>, !options.preserveOrphans ? await this.detectOrphans(entity, changes) : undefined);

      /* If applicable, generate an entity changed event. */
      this.analyticsManager?.trackUpdate(entity, Object.keys(changes), old);

      return r;
    }

    async delete(entity: E): Promise<E> {
      const r = await this.getRepository().remove(entity);

      /* If applicable, generate an entity deleted event. */
      this.analyticsManager?.trackDelete(entity);

      return r;
    }

    async denyAccessUnlessGranted(entities: E | E[], attrs: string | string[], deep?: boolean): Promise<void> {
      if (!this.security) {
        throw new Error('SecurityVoter service not available.');
      }

      entities = Array.isArray(entities) ? entities : [entities];

      for (const entity of entities) {
        try {
          if (!(await this.security.isGranted(target, entity, attrs, RequestContext.get(REQUEST_CONTEXT_USER), !deep))) {
            throw new ForbiddenException();
          }
        } catch (err) {
          if (err.name === 'EntityNotFound') {
            throw new NotFoundException(err);
          } else {
            throw err;
          }
        }
      }
    }

    getRepository(): Repository<E> {
      return repository ? getCustomRepository(repository) : getRepository(target);
    }

    async validate(
      entity: unknown,
      suppressException?: boolean,
      validatorOptions?: ValidatorOptions & {
        isPartial?: boolean;
        type?: Type<any>;
      },
    ): Promise<ValidationError[]> {
      /* If the 'type' parameter is supplied, we will perform type hydration here. */
      const hydrated = validatorOptions?.type ? plainToClass(validatorOptions.type, entity) : entity;

      let errors = await validate(hydrated, {
        validationError: { target: false, value: false },
        ...validatorOptions,
      });

      /* If the 'partial' parameter is set, we'll need to filter out errors for all properties that are in the resulting
       * error set.  This is unfortunately necessary, as IsDefined ignores the validateMissingProperties family of options. */
      if (errors.length && validatorOptions?.isPartial) {
        const filterErrors = (validationErrors: ValidationError[], validatable: unknown) => {
          /* Filter out all errors that do not appear as defined keys in the supplied entity. */
          return validationErrors.filter((error) => {
            let isInEntity = Object.keys(validatable).includes(error.property);

            /* If a given error is indeed in the supplied entity, check to see if it's a subobject that has errors of its own...
             * if so, we may need to recurse into that level and evaluate those errors accordingly. */
            if (isInEntity && error.children?.length) {
              error.children = filterErrors(error.children, validatable[error.property]);

              /* If the above line resulted in purging all child errors, we can safely flip isInEntity to be false. */
              isInEntity = error.children.length > 0;
            }

            return isInEntity;
          });
        };

        errors = filterErrors(errors, entity);
      }

      if (errors.length > 0 && !suppressException) {
        throw new BadRequestException(errors);
      }

      return errors;
    }

    // ---

    /**
     * @description
     * Determines orphans of OneToMany relations, and removes them from the database. This is required because
     * TypeORM does not handle this by itself, and it prevents removing entities in a OneToMany collection by
     * saving an object with the intended collection. Without orphan removal, you must manually delete entities
     * that are no longer in the collection, which won't work when POST/PATCH'ing a parent entity with the full collection.
     */
    private async detectOrphans(entity: E, changes: DeepPartial<E>): Promise<any[]> {
      const orphans = [];

      const repo = this.getRepository();

      const idMap = this.getRepository().metadata.getEntityIdMap(entity);

      const oneToManyRelations = repo.metadata.oneToManyRelations;

      if (idMap && oneToManyRelations.length > 0) {
        const e = await repo.preload(idMap as DeepPartial<E>);

        oneToManyRelations.forEach((relation) => {
          const oldRelationValue = relation.getEntityValue(e);
          const newRelationValue = relation.getEntityValue(changes);

          if (oldRelationValue && newRelationValue) {
            const diff = differenceWith(oldRelationValue, newRelationValue, (first, second) => {
              return repo.metadata.compareEntities(first, second);
            });

            orphans.push(...diff);

            // Pull orphans out of original entity so they don't get saved again
            relation.setEntityValue(
              entity,
              differenceWith(relation.getEntityValue(entity), diff, repo.metadata.compareEntities.bind(repo.metadata)),
            );
          }
        });
      }

      return orphans;
    }

    protected async save(entity: DeepPartial<E>, orphans?: any[]): Promise<E> {
      if (!entity || typeof entity !== 'object') {
        throw new BadRequestException();
      }

      if (!(entity instanceof target)) {
        throw new Error(`Given entity should be instance of ${className(target)}, got ${className(entity)}`);
      }

      await this.validate(entity);

      // BUG: https://github.com/typeorm/typeorm/issues/4090
      // When saving an entity with cascading relations, generated columns such as primary ID are not returned.
      // Until this bug is fixed, strip relations, save the base entity, and then save the relations
      //
      // NOTE: This can be worked around by only passing relations of full objects with IDs
      //
      // const repo = this.getRepository();
      //
      // const relations = {};
      //
      // if (!repo.hasId(entity)) {
      //   for (const relation of repo.metadata.relations) {
      //     relations[relation.propertyName] = relation.getEntityValue(entity);
      //     relation.setEntityValue(entity, undefined);
      //   }
      //
      //   entity = await this.getRepository().save(entity);
      //
      //   for (const relation of repo.metadata.relations) {
      //     relation.setEntityValue(entity, relations[relation.propertyName]);
      //   }
      // }

      return await this.getRepository().manager.transaction(async (manager) => {
        // Handle orphan removal since TypeORM doesn't do it... =/
        if (orphans) {
          await manager.remove(orphans);
        }

        return await manager.save(entity);
      });
    }

    private isCrudFilterObject(obj: CrudFilterFieldDefinition): obj is CrudFilter<any> {
      return typeof obj === 'object' && !Array.isArray(obj);
    }

    private isExposed(property: string, targetType = target) {
      /* Retrieve exclude/expose metadata for the target property */
      const exposeMetadata = defaultMetadataStorage.findExposeMetadata(targetType, property);

      /* Exclude metadata has an extra rule - we only consider exclude annotations if both toClassOnly and toPlainOnly are not set */
      let excludeMetadata = defaultMetadataStorage.findExcludeMetadata(targetType, property);
      excludeMetadata = !excludeMetadata?.options?.toPlainOnly && !excludeMetadata?.options?.toClassOnly ? excludeMetadata : null;

      /* Short circuit cases - if there is no expose metadata to consider, we can make our decision based on the presence of an
       * exclude metadata definition (resulting in a non-exposed field), or whether or not the class strategy is excludeAll.
       * If the exclude metadata dec is present, or if the strategy is set to exclude all, then we must return false. */
      if (!exposeMetadata) {
        return !excludeMetadata && defaultMetadataStorage.getStrategy(targetType) !== 'excludeAll';
      }

      /* If the expose metadata is available, we will evaluate the exposeMetadata to determine if the current user's
       * role should have access to this data. */
      /* Assumption is that no retrieve queries are currently exposed to unauthenticated users. */
      const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);

      return (
        !!user &&
        (!exposeMetadata.options?.groups?.length ||
          exposeMetadata.options.groups.some((whitelistedRole: UserRole) => {
            return user.getRoles().includes(whitelistedRole);
          }))
      );
    }

    private async getFilteredMarkets(): Promise<MarketEntity[]> {
      const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);
      const markets = String(RequestContext.get<string>(REQUEST_CONTEXT_MARKETS))
        .split(',')
        .filter(Boolean)
        .map((code) => code.toUpperCase());

      // TODO: This should probably be elsewhere...
      // TODO: Determine if this applies to users other than Staff
      // TODO: Implement a comprehensive security policy for market accessibility
      if (user instanceof StaffUser) {
        return getRepository(MarketEntity).find({
          where: {
            code: In(
              isAdministrator(user)
                ? markets
                : // Force filtering of only accessible markets for non-admin staff
                intersection(
                  markets,
                  user.markets.map((market) => market.code.toUpperCase()),
                ),
            ),
          },
        });
      }

      return [];
    }
  }

  return CrudServiceHost;
}
