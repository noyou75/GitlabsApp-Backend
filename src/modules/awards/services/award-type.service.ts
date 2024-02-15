import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, SetMetadata, Type } from '@nestjs/common';
import { AwardType } from '../../../common/enums/award-type.enum';
import { AwardDescriptor } from './award-descriptor.service';

const AwardTypeMetadataKey = 'AwardTypeMetadataKey';

export interface AwardProcessor<T, K extends AwardDescriptor = AwardDescriptor> {
  process: (target: T, awardDescriptor: K) => Promise<void>;
}

export function Award<T>(awardType: AwardType) {
  return (target: Type<AwardProcessor<T>>) => {
    SetMetadata(AwardTypeMetadataKey, awardType)(target);
  }
}

@Injectable()
export class AwardTypeService implements OnModuleInit {
  private readonly awardTypeDefinitions: { [key in AwardType]?: AwardProcessor<any> } = {};

  constructor(private readonly discoveryService: DiscoveryService) {}

  public onModuleInit(): any {
    /* Resolve the award types defined by use of the @AwardTypeDefinition decorator. */
    return this.discoveryService.providersWithMetaAtKey<AwardType>(AwardTypeMetadataKey).then(providers => {
      providers.forEach(provider => {
        /* Only a single award type definition is permitted for each award type. */
        this.awardTypeDefinitions[provider.meta] = provider.discoveredClass.instance as AwardProcessor<any>;
      });
    });
  }

  public getAwardTypeDefinition<T = any>(awardType: AwardType): AwardProcessor<T> {
    /* Return the award type definition at the defined key */
    return this.awardTypeDefinitions[awardType];
  }
}
