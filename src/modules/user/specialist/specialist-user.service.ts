import { Inject, Injectable } from '@nestjs/common';
import { SpecialistUser } from '../../../entities/user.entity';
import { CrudService } from '../../api/crud/crud.service';
import { MarketEntity } from '../../../entities/market.entity';
import { MarketService } from '../../market/market.service';

@Injectable()
export class SpecialistUserService extends CrudService(SpecialistUser) {
  @Inject()
  private readonly marketService: MarketService;

  async setMarkets(user: SpecialistUser, marketIds: string[]): Promise<MarketEntity[]> {
    user.markets = await this.marketService.getRepository().findByIds(marketIds);
    await this.getRepository().save(user);
    return user.markets;
  }
}
