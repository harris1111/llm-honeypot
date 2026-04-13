import { Global, Module } from '@nestjs/common';

import { CaptureBufferService } from './capture/capture-buffer.service';
import { HttpCaptureService } from './capture/http-capture.service';
import { CaptureSyncService } from './capture/capture-sync.service';
import { getNodeRuntimeConfig, NODE_RUNTIME_CONFIG } from './config/node-runtime-config';
import { RuntimeStateService } from './runtime/runtime-state.service';
import { DashboardApiService } from './sync/dashboard-api.service';

@Global()
@Module({
  exports: [
    CaptureBufferService,
    HttpCaptureService,
    CaptureSyncService,
    DashboardApiService,
    NODE_RUNTIME_CONFIG,
    RuntimeStateService,
  ],
  providers: [
    { provide: NODE_RUNTIME_CONFIG, useValue: getNodeRuntimeConfig() },
    CaptureBufferService,
    HttpCaptureService,
    CaptureSyncService,
    DashboardApiService,
    RuntimeStateService,
  ],
})
export class NodeSharedModule {}