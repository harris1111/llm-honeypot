import { Module } from '@nestjs/common';

import { WorkerRuntimeConfigService } from './config/worker-runtime-config.service';
import { ActorCorrelationProcessorService } from './processors/actor-correlation-processor.service';
import { AlertProcessorService } from './processors/alert-processor.service';
import { ArchiveProcessorService } from './processors/archive-processor.service';
import { ClassificationProcessorService } from './processors/classification-processor.service';
import { EnrichmentProcessorService } from './processors/enrichment-processor.service';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Module({
  controllers: [WorkerController],
  providers: [
    WorkerRuntimeConfigService,
    ArchiveProcessorService,
    ClassificationProcessorService,
    EnrichmentProcessorService,
    ActorCorrelationProcessorService,
    AlertProcessorService,
    WorkerService,
  ],
})
export class WorkerModule {}