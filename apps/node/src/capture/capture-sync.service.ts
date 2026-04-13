import type { CaptureRecord } from '@llmtrap/shared';
import { Inject, Injectable } from '@nestjs/common';

import { NODE_RUNTIME_CONFIG } from '../config/node-runtime-config';
import type { NodeRuntimeConfig } from '../config/node-runtime-config';
import { RuntimeStateService } from '../runtime/runtime-state.service';
import { DashboardApiService } from '../sync/dashboard-api.service';
import { CaptureBufferService } from './capture-buffer.service';

@Injectable()
export class CaptureSyncService {
  constructor(
    private readonly captureBuffer: CaptureBufferService,
    private readonly dashboardApiService: DashboardApiService,
    private readonly runtimeStateService: RuntimeStateService,
    @Inject(NODE_RUNTIME_CONFIG) private readonly config: NodeRuntimeConfig,
  ) {}

  async flushPending(): Promise<number> {
    const nodeId = this.runtimeStateService.getNodeId();
    if (!nodeId) {
      return 0;
    }

    const records = await this.captureBuffer.peek(this.config.captureBatchSize);
    if (records.length === 0) {
      return 0;
    }

    await this.dashboardApiService.uploadCaptures(nodeId, records);
    await this.captureBuffer.acknowledge(records.length);

    return records.length;
  }

  async queueCapture(record: CaptureRecord): Promise<void> {
    await this.captureBuffer.enqueue(record);
  }

  async size(): Promise<number> {
    return this.captureBuffer.size();
  }
}