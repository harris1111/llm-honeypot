import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LiveFeedService } from './live-feed.service';

@Controller('live-feed')
export class LiveFeedController {
  constructor(@Inject(LiveFeedService) private readonly liveFeedService: LiveFeedService) {}

  @Get('events')
  @UseGuards(JwtAuthGuard)
  list(
    @Query('classification') classification?: string,
    @Query('nodeId') nodeId?: string,
    @Query('service') service?: string,
    @Query('sourceIp') sourceIp?: string,
  ) {
    return this.liveFeedService.list({ classification, nodeId, service, sourceIp });
  }
}