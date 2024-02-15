import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { OptInDto } from './dto/opt-in.dto';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('opt-in')
  @UseGuards(AuthGuard(['jwt']))
  public optIn(@Body() optInDto: OptInDto) {
    return this.marketingService.optIn(RequestContext.get(REQUEST_CONTEXT_USER), optInDto.optInType);
  }
}
