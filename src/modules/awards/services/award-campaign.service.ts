import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { AwardType } from '../../../common/enums/award-type.enum';
import { AwardCampaignEntity } from '../../../entities/award-campaign.entity';
import { CrudService } from '../../api/crud/crud.service';
import { LoggerService } from '../../core/services/logger.service';
import { filterNullish } from '../../shared/util/object.util';
import { AwardConditionsService } from './award-conditions.service';
import { AwardDescriptor, AwardDescriptorService } from './award-descriptor.service';
import { AwardTypeService } from './award-type.service';

@Injectable()
export class AwardCampaignService extends CrudService(AwardCampaignEntity) {
  @Inject()
  private readonly awardConditionsService: AwardConditionsService;

  @Inject()
  private readonly awardTypeService: AwardTypeService;

  @Inject()
  private readonly loggerService: LoggerService;

  @Inject()
  private readonly awardDescriptorService: AwardDescriptorService;

  public async isEligible(awardCampaign: AwardCampaignEntity, target: any): Promise<boolean> {
    /* Resolve the descriptor that maps to the supplied award campaign type / target */
    const descriptor = await this.awardDescriptorService.getAwardDescriptor(target, awardCampaign.awardType);

    /* If the descriptor is not defined, return false. Otherwise, assess the descriptor for eligibility. */
    return !!descriptor && this._isEligible(awardCampaign, target, descriptor);
  }

  public async applyAward(awardCampaign: AwardCampaignEntity, target: any): Promise<void> {
    /* Retrieve the award descriptor that is appropriate for the supplied campaign's award type. */
    const descriptor = await this.awardDescriptorService.getAwardDescriptor(target, awardCampaign.awardType);

    /* First, check to see if this award is eligible.  Then, apply the award... */
    if (!descriptor || !(await this._isEligible(awardCampaign, target, descriptor))) {
      this.loggerService.warn(`Could not apply award - the inbound award campaign is not eligible to be ` +
        `invoked.`);
      return;
    }

    /* Resolve the service according to the supplied award type, and invoke the award application handler */
    const service = this.awardTypeService.getAwardTypeDefinition(awardCampaign.awardType);

    /* If no service for this particular award type exists, throw an exception. */
    if (!service) {
      throw new BadRequestException(`Cannot invoke award for ${ awardCampaign.awardType }; no handler ` +
        `for this award type exists.`);
    }

    return service.process(target, descriptor);
  }

  public getActiveCampaigns(queryObj: DeepPartial<AwardCampaignEntity>) {
    return this.find((opts => {
      /* Attach the supplied query values to the find conditions, and append isActive = true... */
      // Meant largely as a placeholder for when we add expiration dates to campaigns
      opts.where = {
        ...queryObj,
        isActive: true,
      }
    }))
  }

  async getCampaignByType(awardType: AwardType, name?: string): Promise<AwardCampaignEntity> {
    /* Search for all active campaigns assigned to the supplied award type/name. */
    const activeCampaigns = await this.getActiveCampaigns(filterNullish({
      awardType,
      name,
    }));

    /* If name is not supplied, return the campaign that is marked as default.  Otherwise, return the first result from the retrieved
     * set. */
    return activeCampaigns.data?.length &&
      ((!name && activeCampaigns.data.find(activeCampaign => activeCampaign.isDefault)) || activeCampaigns.data[0]);
  }

  private async _isEligible<T = any>(awardCampaign: AwardCampaignEntity, target: any, awardDescriptor: AwardDescriptor) {
    /* If the peer referral is falsy, not pending, the linked award campaign is falsy, or the linked award campaign is not
     * active, return false immediately. */
    if (!awardCampaign || !awardCampaign.isActive) {
      return false;
    }

    /* Check the supplied referral campaign's conditions to determine if the referral is eligible to receive an award.  If no
     * conditions are defined, we can return true immediately. */
    return !awardCampaign.awardConditions || !awardCampaign.awardConditions.length ||
      Promise.all(awardCampaign.awardConditions.map(condition => !this.awardConditionsService.getConditionsHandler(condition) ||
        this.awardConditionsService.getConditionsHandler(condition).isEligible(awardCampaign, target, awardDescriptor))).then(results => {
        return results.every(result => !!result);
      });
  }
}
