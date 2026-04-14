import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { ArchiveStorageService } from './archive-storage.service';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  controllers: [ExportController],
  imports: [AuditModule],
  providers: [ArchiveStorageService, ExportService],
})
export class ExportModule {}