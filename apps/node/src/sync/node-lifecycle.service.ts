import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';

import { CaptureSyncService } from '../capture/capture-sync.service';
import { NODE_RUNTIME_CONFIG } from '../config/node-runtime-config';
import type { NodeRuntimeConfig } from '../config/node-runtime-config';
import { RuntimeStateService } from '../runtime/runtime-state.service';
import { DashboardApiService } from './dashboard-api.service';

@Injectable()
export class NodeLifecycleService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(NodeLifecycleService.name);
  private configTimer?: NodeJS.Timeout;
  private flushTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private isConfigSyncRunning = false;
  private isFlushRunning = false;
  private isHeartbeatRunning = false;
  private isRegistrationRunning = false;

  constructor(
    private readonly captureSyncService: CaptureSyncService,
    private readonly dashboardApiService: DashboardApiService,
    private readonly runtimeStateService: RuntimeStateService,
    @Inject(NODE_RUNTIME_CONFIG) private readonly config: NodeRuntimeConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureRegistered();
    this.startTimers();
  }

  onModuleDestroy(): void {
    for (const timer of [this.heartbeatTimer, this.configTimer, this.flushTimer]) {
      if (timer) {
        clearInterval(timer);
      }
    }
  }

  private async ensureRegistered(): Promise<boolean> {
    const currentNode = this.runtimeStateService.getNode();
    if (currentNode?.id && currentNode.status === 'ONLINE') {
      return true;
    }

    if (this.isRegistrationRunning) {
      return false;
    }

    this.isRegistrationRunning = true;

    try {
      const registration = await this.dashboardApiService.registerNode();
      this.runtimeStateService.applyRegistration(registration);
      this.runtimeStateService.clearSyncError();

      return registration.node.status === 'ONLINE';
    } catch (error) {
      this.runtimeStateService.markSyncError(error);
      this.logger.warn(`Node registration failed: ${this.toErrorMessage(error)}`);

      return false;
    } finally {
      this.isRegistrationRunning = false;
    }
  }

  private async runConfigCycle(): Promise<void> {
    if (this.isConfigSyncRunning || !(await this.ensureRegistered())) {
      return;
    }

    const nodeId = this.runtimeStateService.getNodeId();
    if (!nodeId) {
      return;
    }

    this.isConfigSyncRunning = true;

    try {
      const config = await this.dashboardApiService.fetchNodeConfig(nodeId);
      this.runtimeStateService.applyConfig(config);
      this.runtimeStateService.clearSyncError();
    } catch (error) {
      this.runtimeStateService.markSyncError(error);
      this.logger.warn(`Node config refresh failed: ${this.toErrorMessage(error)}`);
    } finally {
      this.isConfigSyncRunning = false;
    }
  }

  private async runFlushCycle(): Promise<void> {
    if (this.isFlushRunning || !(await this.ensureRegistered())) {
      return;
    }

    this.isFlushRunning = true;

    try {
      const flushedCount = await this.captureSyncService.flushPending();
      if (flushedCount > 0) {
        this.runtimeStateService.clearSyncError();
      }
    } catch (error) {
      this.runtimeStateService.markSyncError(error);
      this.logger.warn(`Capture flush failed: ${this.toErrorMessage(error)}`);
    } finally {
      this.isFlushRunning = false;
    }
  }

  private async runHeartbeatCycle(): Promise<void> {
    if (this.isHeartbeatRunning || !(await this.ensureRegistered())) {
      return;
    }

    const nodeId = this.runtimeStateService.getNodeId();
    if (!nodeId) {
      return;
    }

    this.isHeartbeatRunning = true;

    try {
      const bufferSize = await this.captureSyncService.size();
      const heartbeat = this.runtimeStateService.buildHeartbeat(bufferSize);

      await this.dashboardApiService.sendHeartbeat(nodeId, heartbeat);
      this.runtimeStateService.clearSyncError();
    } catch (error) {
      this.runtimeStateService.markSyncError(error);
      this.logger.warn(`Heartbeat failed: ${this.toErrorMessage(error)}`);
    } finally {
      this.isHeartbeatRunning = false;
    }
  }

  private startTimers(): void {
    this.heartbeatTimer = setInterval(() => {
      void this.runHeartbeatCycle();
    }, this.config.heartbeatIntervalMs);

    this.configTimer = setInterval(() => {
      void this.runConfigCycle();
    }, this.config.configRefreshIntervalMs);

    this.flushTimer = setInterval(() => {
      void this.runFlushCycle();
    }, this.config.flushIntervalMs);

    void this.runHeartbeatCycle();
    void this.runConfigCycle();
    void this.runFlushCycle();
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown failure';
  }
}