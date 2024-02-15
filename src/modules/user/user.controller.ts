import { Body, ForbiddenException, Get, Inject, Param, Post, Query, Type } from '@nestjs/common';
import { defaults } from 'lodash';
import { Brackets } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { DocumentEmbed } from '../../entities/embed/document.embed';
import { SpecialistUser, User } from '../../entities/user.entity';
import { CrudController, ICrudControllerOptions } from '../api/crud/crud.controller';
import { ICrudService } from '../api/crud/crud.service';
import { QueryOptionsDto } from '../api/crud/query-options.dto';
import { SearchParams } from '../api/crud/search.params';
import { PagedResponseDto } from '../api/pagination/paged-response.dto';
import { PaginationOptionsDto } from '../api/pagination/pagination-options.dto';
import { Roles } from '../auth/roles.decorator';
import { SECURITY_ATTR_MODIFY } from '../core/security/security-voter.const';
import { HelloSignService } from '../core/services/hello-sign.service';
import { ConvertToEntity } from '../shared/decorators/convert-to-entity.decorator';
import { DocumentSignUrlRequestDto } from './dto/document-sign-url-request.dto';
import { DocumentSignUrlDto } from './dto/document-sign-url.dto';
import { DocumentDto } from './dto/document.dto';

export function UserController<E extends User, S extends ICrudService<E, any>>(
  target: Type<E>,
  service: Type<S>,
  options?: ICrudControllerOptions<E, S>,
) {
  options = defaults(options, {
    query: (qb, params: SearchParams) => {
      if (params.search) {
        qb.where(
          new Brackets(qbWhere => {
            qbWhere
              .where(`${qb.alias}.firstName ILIKE :search`)
              .orWhere(`${qb.alias}.lastName ILIKE :search`)
              .orWhere(`${qb.alias}.email ILIKE :search`)
              .orWhere(`${qb.alias}.phoneNumber ILIKE :search`);
          }),
        );

        qb.setParameter('search', params.search + '%');
      }
    },
  });

  class UserControllerHost extends CrudController<E, S>(target, service, options) {
    @Inject()
    helloSignService: HelloSignService;

    @Get()
    async list(
      @Query() pagination: PaginationOptionsDto,
      @Query() crudOptions: QueryOptionsDto<E>,
      @Query() params: SearchParams,
    ): Promise<PagedResponseDto<E>> {
      return await super.list(pagination, crudOptions, params);
    }

    @Post(':id/document')
    async updateDocument(@ConvertToEntity({ type: target }) entity: E, @Body() dto: DocumentDto): Promise<DocumentEmbed> {
      await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY);

      entity.updateDocument(DocumentEmbed.fromDto(dto));

      // @ts-ignore: TS compiler error?
      await this.service.update(entity, { documents: entity.documents });

      return entity.getDocument(dto.type);
    }

    @Get(':id/document/:type/signing-url')
    @Roles(UserRole.Specialist)
    async readDocumentSigningUrl(
      @ConvertToEntity({ type: target }) entity: E,
      @Param() params: DocumentSignUrlRequestDto,
    ): Promise<DocumentSignUrlDto> {
      if (!(entity instanceof SpecialistUser)) {
        throw new ForbiddenException();
      }

      const resp = await this.helloSignService.getSigningUrl(entity, params.type);

      // getSigningUrl() method updates the entity documents with the document signature ID if it
      // doesn't exist, but doesn't save it to the database, so save it here

      // @ts-ignore: TS compiler error?
      await this.service.update(entity, { documents: entity.documents });

      return {
        signUrl: resp.sign_url,
        expiresAt: new Date(resp.expires_at * 1000),
      };
    }
  }

  return UserControllerHost;
}
