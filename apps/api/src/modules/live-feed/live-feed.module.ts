import { Module } from '@nestjs/common';

import { LiveFeedController } from './live-feed.controller';
import { LiveFeedGateway } from './live-feed.gateway';
import { LiveFeedService } from './live-feed.service';

@Module({
  controllers: [LiveFeedController],
  exports: [LiveFeedService],
  providers: [LiveFeedGateway, LiveFeedService],
})
export class LiveFeedModule {}