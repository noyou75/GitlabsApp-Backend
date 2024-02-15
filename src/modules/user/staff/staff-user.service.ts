import { Inject, Injectable } from '@nestjs/common';
import { StaffUser } from '../../../entities/user.entity';
import { CrudService } from '../../api/crud/crud.service';
import { MarketEntity } from '../../../entities/market.entity';
import { MarketService } from '../../market/market.service';

@Injectable()
export class StaffUserService extends CrudService(StaffUser) {
  @Inject()
  private readonly marketService: MarketService;

  async setMarkets(user: StaffUser, marketIds: string[]): Promise<MarketEntity[]> {
    user.markets = await this.marketService.getRepository().findByIds(marketIds);
    await this.getRepository().save(user);
    return user.markets;
  }
}
