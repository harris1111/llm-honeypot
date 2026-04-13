import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';

@Module({
  controllers: [PersonasController],
  imports: [AuditModule],
  providers: [PersonasService],
})
export class PersonasModule {}