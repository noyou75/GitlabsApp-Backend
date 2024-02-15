import { Injectable } from '@nestjs/common';
import { AppointmentSampleEntity } from '../../../entities/appointment-sample.entity';
import { CrudService } from '../../api/crud/crud.service';

@Injectable()
export class AppointmentSampleService extends CrudService(AppointmentSampleEntity) {}
