import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';

@Module({
  controllers: [NodesController],
  exports: [NodesService],
  imports: [AuditModule],
  providers: [NodesService],
})
export class NodesModule {}