import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { LiveFeedModule } from '../live-feed/live-feed.module';
import { NodesModule } from '../nodes/nodes.module';
import { CaptureController } from './capture.controller';
import { CaptureService } from './capture.service';

@Module({
  controllers: [CaptureController],
  imports: [AuditModule, LiveFeedModule, NodesModule],
  providers: [CaptureService],
})
export class CaptureModule {}