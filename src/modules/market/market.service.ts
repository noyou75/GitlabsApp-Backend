import { Injectable } from '@nestjs/common';
import { MarketEntity } from '../../entities/market.entity';
import { CrudService } from '../api/crud/crud.service';

@Injectable()
export class MarketService extends CrudService(MarketEntity) {}
