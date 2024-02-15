import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { LabCompany } from '../../../common/enums/lab-company.enum';
import { IReferrer, ReferrerMetadataKey } from '../decorators/referrer.decorator';

@Injectable()
export class ReferrerService implements OnModuleInit {
  private referrers: { [key in LabCompany]?: { type: Type<IReferrer>; instance?: IReferrer } };

  constructor(private readonly discoveryService: DiscoveryService, private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.referrers = await this.discoveryService.providersWithMetaAtKey<LabCompany>(ReferrerMetadataKey).then(providers => {
      return providers.reduce((collector, provider) => {
        collector[provider.meta] = { type: provider.discoveredClass.injectType };
        return collector;
      }, {});
    });
  }

  getReferrerService(labCompany: LabCompany) {
    const referrer = this.referrers[labCompany];

    /* If the referrer service for the inbound lab company doesn't exist, throw an exception. */
    if (!referrer) {
      throw new Error(
        `Cannot retrieve referrer service for ${labCompany}; please ensure you have a class ` +
          `decorated with @Referrer('${labCompany}') `,
      );
    }

    /* If an instance does not exist yet, create one now */
    if (!referrer.instance) {
      referrer.instance = this.moduleRef.get(referrer.type, { strict: false });
    }

    return referrer.instance;
  }
}
