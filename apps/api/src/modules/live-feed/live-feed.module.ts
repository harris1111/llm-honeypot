import { Module } from '@nestjs/common';

import { LiveFeedController } from './live-feed.controller';
import { LiveFeedService } from './live-feed.service';

@Module({
  controllers: [LiveFeedController],
  providers: [LiveFeedService],
})
export class LiveFeedModule {}