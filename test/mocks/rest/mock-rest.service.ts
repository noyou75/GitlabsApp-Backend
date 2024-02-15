import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../../src/modules/api/crud/crud.service';
import { MockEntity } from '../mock.entity';

@Injectable()
export class MockRestService extends CrudService(MockEntity) {
  constructor(@InjectRepository(MockEntity) repository: Repository<MockEntity>) {
    super(repository);
  }
}
