import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { NodesModule } from '../nodes/nodes.module';
import { CaptureController } from './capture.controller';
import { CaptureService } from './capture.service';

@Module({
  controllers: [CaptureController],
  imports: [AuditModule, NodesModule],
  providers: [CaptureService],
})
export class CaptureModule {}