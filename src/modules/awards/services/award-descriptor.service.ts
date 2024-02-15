import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, SetMetadata, Type } from '@nestjs/common';
import { AwardType } from '../../../common/enums/award-type.enum';
import { AwardCampaignEntity } from '../../../entities/award-campaign.entity';
import { User } from '../../../entities/user.entity';

const AwardDescriptorResolverMetadataKey = 'AwardDescriptorResolverMetadataKey';

export interface AwardFulfillmentData {
  [key: string]: any;
}

export interface AwardDescriptor {
  getCampaign(): AwardCampaignEntity;
  getFulfillmentData(): AwardFulfillmentData;
}

export interface ActorAwardDescriptor extends AwardDescriptor {
  getActor(): User
}

export interface AwardDescriptorMetadata<E> {
  awardType: AwardType;
  entity: Type<E>;
}

export function AwardDescriptorResolver<E>(metadata: AwardDescriptorMetadata<E>) {
  return (type: Type<IAwardDescriptorResolver<E>>) => {
    SetMetadata<string, AwardDescriptorMetadata<E>>(AwardDescriptorResolverMetadataKey, metadata)(type)
  }
}

export interface IAwardDescriptorResolver<E> {
  resolve(entity: E): Promise<AwardDescriptor>;
}

type AwardTypeDescriptorResolver<E> = {
  [key in AwardType]?: IAwardDescriptorResolver<E>;
}

interface ResolverIndex {
  [key: string]: AwardTypeDescriptorResolver<any>
}

@Injectable()
export class AwardDescriptorService implements OnModuleInit {
  private readonly resolverIndex: ResolverIndex = {};

  constructor(private readonly discoveryService: DiscoveryService) {

  }

  onModuleInit(): any {
    this.discoveryService.providersWithMetaAtKey<AwardDescriptorMetadata<any>>(AwardDescriptorResolverMetadataKey).then(providers => {
      /* Cycle through each identified provider, and index them based on their annotated award type and entity. */
      providers.forEach(provider => {
        /* Create entity-level group if none already exists... */
        if (!this.resolverIndex[provider.meta.entity.name]) {
          this.resolverIndex[provider.meta.entity.name] = {};
        }

        /* Create an entry for the provider's indicated award type */
        this.resolverIndex[provider.meta.entity.name][provider.meta.awardType] = provider.discoveredClass.instance as IAwardDescriptorResolver<any>;
      });
    });
  }

  async getAwardDescriptor<T extends {} = {}>(entity: T, awardType: AwardType) {
    /* Retrieve the provider that corresponds to the supplied entity and award type */
    const entityGroup = this.resolverIndex[Object.getPrototypeOf(entity).constructor.name];
    return entityGroup && entityGroup[awardType].resolve(entity);
  }
}
