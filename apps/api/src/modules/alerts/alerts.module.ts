import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  controllers: [AlertsController],
  imports: [AuditModule],
  providers: [AlertsService],
})
export class AlertsModule {}