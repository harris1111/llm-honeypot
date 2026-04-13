import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import type { WorkerRuntimeConfig } from './config/worker-runtime-config.service';
import { WorkerRuntimeConfigService } from './config/worker-runtime-config.service';
import { ActorCorrelationProcessorService } from './processors/actor-correlation-processor.service';
import { AlertProcessorService } from './processors/alert-processor.service';
import { ClassificationProcessorService } from './processors/classification-processor.service';
import { EnrichmentProcessorService } from './processors/enrichment-processor.service';
import type { WorkerProcessor } from './processors/processor-contract';

export interface ProcessorState {
  handled: number;
  lastError?: string;
  lastRunAt?: string;
  lastSummary?: string;
  running: boolean;
}

export interface WorkerStatusSnapshot {
  config: WorkerRuntimeConfig;
  healthy: boolean;
  processors: Record<string, ProcessorState>;
}

@Injectable()
export class WorkerService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private readonly processorStates = new Map<string, ProcessorState>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly configService: WorkerRuntimeConfigService,
    private readonly classificationProcessor: ClassificationProcessorService,
    private readonly enrichmentProcessor: EnrichmentProcessorService,
    private readonly actorProcessor: ActorCorrelationProcessorService,
    private readonly alertProcessor: AlertProcessorService,
  ) {}

  onModuleInit(): void {
    this.scheduleProcessor(this.classificationProcessor, this.configService.snapshot.intervals.classificationMs);
    this.scheduleProcessor(this.enrichmentProcessor, this.configService.snapshot.intervals.enrichmentMs);
    this.scheduleProcessor(this.actorProcessor, this.configService.snapshot.intervals.actorMs);
    this.scheduleProcessor(this.alertProcessor, this.configService.snapshot.intervals.alertMs);
    this.logger.log('Worker bootstrap complete. Background processors scheduled.');
  }

  onModuleDestroy(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
  }

  getStatus(): WorkerStatusSnapshot {
    const processors = Object.fromEntries(this.processorStates.entries());
    return {
      config: this.configService.snapshot,
      healthy: [...this.processorStates.values()].every((state) => !state.lastError),
      processors,
    };
  }

  private scheduleProcessor(processor: WorkerProcessor, intervalMs: number): void {
    this.processorStates.set(processor.name, { handled: 0, running: false });
    void this.runProcessor(processor);

    const timer = setInterval(() => {
      void this.runProcessor(processor);
    }, intervalMs);
    this.timers.set(processor.name, timer);
  }

  private async runProcessor(processor: WorkerProcessor): Promise<void> {
    const state = this.processorStates.get(processor.name);
    if (!state || state.running) {
      return;
    }

    state.running = true;
    try {
      const result = await processor.run();
      state.handled = result.handled;
      state.lastError = undefined;
      state.lastRunAt = new Date().toISOString();
      state.lastSummary = result.summary;
      this.logger.log(`[${processor.name}] ${result.summary}`);
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error);
      state.lastRunAt = new Date().toISOString();
      this.logger.error(`[${processor.name}] ${state.lastError}`);
    } finally {
      state.running = false;
    }
  }
}