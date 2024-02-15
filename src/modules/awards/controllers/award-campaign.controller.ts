import { Controller, Get, Param, Query } from '@nestjs/common';
import { AwardTypeQueryDto } from '../dto/award-type-query.dto';
import { AwardTypeDto } from '../dto/award-type.dto';
import { AwardCampaignService } from '../services/award-campaign.service';

/* Controller is deliberately public */
@Controller('award-campaign')
export class AwardCampaignController {
  constructor(private readonly awardCampaignService: AwardCampaignService) { }

  @Get('type/:awardType')
  async getAwardCampaignType(@Param() awardCampaignTypeDto: AwardTypeDto, @Query() awardTypeQueryDto: AwardTypeQueryDto) {
    return this.awardCampaignService.getCampaignByType(
      awardCampaignTypeDto.awardType,
      awardTypeQueryDto.name
    );
  }
}
