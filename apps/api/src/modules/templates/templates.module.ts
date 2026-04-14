import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  controllers: [TemplatesController],
  imports: [AuditModule],
  providers: [TemplatesService],
})
export class TemplatesModule {}