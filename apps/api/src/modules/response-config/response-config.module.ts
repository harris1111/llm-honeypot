import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ResponseConfigController } from './response-config.controller';
import { ResponseConfigService } from './response-config.service';

@Module({
  controllers: [ResponseConfigController],
  imports: [AuditModule],
  providers: [ResponseConfigService],
})
export class ResponseConfigModule {}