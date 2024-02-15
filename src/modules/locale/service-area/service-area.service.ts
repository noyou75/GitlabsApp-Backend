import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { CrudService } from '../../api/crud/crud.service';
import { MappingService } from '../../core/services/mapping.service';

@Injectable()
export class ServiceAreaService extends CrudService(ServiceAreaEntity) {
  @Inject()
  private readonly mapping: MappingService;

  async getByZipCode(zipCode: string): Promise<ServiceAreaEntity> {
    return await (this.getRepository() as Repository<ServiceAreaEntity>).findOne(
      {
        zipCode: String(zipCode).trim(),
      },
      {
        relations: ['market'],
      },
    );
  }

  async isActive(serviceArea: ServiceAreaEntity): Promise<boolean>;
  async isActive(serviceArea: string): Promise<boolean>;
  async isActive(serviceArea: string | ServiceAreaEntity): Promise<boolean> {
    const entity = serviceArea instanceof ServiceAreaEntity ? serviceArea : await this.getByZipCode(serviceArea);
    return !!(entity && entity.active && entity.market.isActive);
  }
}
