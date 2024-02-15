import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, SetMetadata, Type } from '@nestjs/common';
import { AwardConditionsEnum } from '../../../common/enums/award-conditions.enum';
import { AwardCampaignEntity } from '../../../entities/award-campaign.entity';
import { AwardDescriptor } from './award-descriptor.service';

const AwardConditionsMetadataKey = 'AwardConditionsMetadataKey';

export interface AwardConditionsHandler<E, A extends AwardDescriptor = AwardDescriptor> {
  isEligible(awardCampaign: AwardCampaignEntity, target: E, awardDescriptor: A): Promise<boolean>;
}

export function AwardConditions<E, A extends AwardDescriptor = AwardDescriptor>(condition: AwardConditionsEnum) {
  return (type: Type<AwardConditionsHandler<E>>) => {
    /* Register the supplied condition as a metadata value on the annotated handler */
    SetMetadata(AwardConditionsMetadataKey, condition)(type);
  }
}

@Injectable()
export class AwardConditionsService implements OnModuleInit {
  private readonly awardConditions: { [key in AwardConditionsEnum]?: AwardConditionsHandler<any> } = {};

  constructor(private readonly discoveryService: DiscoveryService) {}

  onModuleInit(): any {
    return this.discoveryService.providersWithMetaAtKey<AwardConditionsEnum>(AwardConditionsMetadataKey).then(providerDefs => {
      /* Create an index of all conditions registered. */
      providerDefs.forEach(providerDef => {
        this.awardConditions[providerDef.meta] = providerDef.discoveredClass.instance as AwardConditionsHandler<any>;
      });
    });
  }

  public getConditionsHandler(condition: AwardConditionsEnum) {
    return this.awardConditions[condition];
  }
}
