import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ActorsController } from './actors.controller';
import { ActorsService } from './actors.service';

@Module({
  controllers: [ActorsController],
  imports: [AuditModule],
  providers: [ActorsService],
})
export class ActorsModule {}