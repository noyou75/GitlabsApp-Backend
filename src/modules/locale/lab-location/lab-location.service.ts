import { Inject, Injectable } from '@nestjs/common';
import { LabLocationEntity } from '../../../entities/lab-location.entity';
import { CrudService } from '../../api/crud/crud.service';
import { AddressEmbed } from '../../../entities/embed/address.embed';
import { MarketEntity } from '../../../entities/market.entity';
import { MarketService } from '../../market/market.service';
import { filterNullish } from "../../shared/util/object.util";

@Injectable()
export class LabLocationService extends CrudService(LabLocationEntity) {
  @Inject()
  private readonly marketService: MarketService;

  public async getLabLocationsByAddress(zipCode: string, street?: string, isPublic?: boolean): Promise<LabLocationEntity[]> {
    const locations = await this.getRepository().find({
      where: filterNullish({
        address: {
          zipCode: zipCode,
        },
        public: isPublic
      }),
    });
    if (!street) {
      return locations;
    }
    return locations.filter((l: LabLocationEntity) => l.address.street === street);
  }

  public async isAddressLab(address: AddressEmbed): Promise<boolean> {
    if (!address?.zipCode || !address?.street) {
      return false;
    }
    return (await this.getLabLocationsByAddress(address.zipCode, address.street)).length > 0;
  }

  async setMarkets(labLocation: LabLocationEntity, marketIds: string[]): Promise<MarketEntity[]> {
    labLocation.markets = await this.marketService.getRepository().findByIds(marketIds);
    await this.getRepository().save(labLocation);
    return labLocation.markets;
  }
}
