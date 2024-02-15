import { Injectable } from '@nestjs/common';
import { EventSubscriber } from 'typeorm';
import { PatientUser } from '../../../entities/user.entity';
import { EntitySubscriber } from '../../entity/subscriber/entity.subscriber';

@Injectable()
@EventSubscriber()
export class PatientUserSubscriber extends EntitySubscriber(PatientUser) {}
