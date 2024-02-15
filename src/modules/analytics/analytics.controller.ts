import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { AnalyticsEventDto, AnalyticsResponseDto, WebEntryDto, WebEntryResponseDto } from './dto/analytics.dto';
import { AnalyticsService } from './services/analytics.service';

/**
 * The analytics controller exposes API endpoints for creating and managing application analytics.
 */
@Controller('analytics')
@UseGuards(AuthGuard(['jwt', 'anonymous']))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Tracks the event defined by the post body.
   * Endpoint is publicly exposed; rate limiting is performed on a narrowed scope.
   */
  @Post()
  @HttpCode(201)
  @RateLimit({ interval: 60, limit: 60 })
  public async trackEvent(@Body() event: AnalyticsEventDto): Promise<AnalyticsResponseDto> {
    return this.analyticsService.trackEvent(event);
  }

  /**
   * Endpoint is publicly exposed; rate limiting selected to avoid exploitation
   */
  @Post('web-entry')
  @HttpCode(201)
  @RateLimit({ interval: 60, limit: 10 })
  public async webEntry(@Body() event: WebEntryDto): Promise<WebEntryResponseDto> {
    return this.analyticsService.webEntry(event);
  }
}
