import { createHash } from 'node:crypto';
import type { ProtocolService } from '@llmtrap/shared';
import { Injectable, Logger } from '@nestjs/common';

import { RuntimeStateService } from '../runtime/runtime-state.service';
import { CaptureSyncService } from './capture-sync.service';

type CaptureStrategy = 'real_model' | 'static' | 'template';

export interface ProtocolCaptureInput {
  headers?: Record<string, unknown>;
  method: string;
  path?: string;
  protocol: string;
  requestBody?: unknown;
  responseBody?: unknown;
  responseCode?: number;
  responseStrategy?: CaptureStrategy;
  service: ProtocolService;
  sourceIp: string;
  sourcePort?: number;
  tlsFingerprint?: string;
  userAgent?: string;
}

@Injectable()
export class ProtocolCaptureService {
  private readonly logger = new Logger(ProtocolCaptureService.name);

  constructor(
    private readonly captureSyncService: CaptureSyncService,
    private readonly runtimeStateService: RuntimeStateService,
  ) {}

  async record(input: ProtocolCaptureInput): Promise<void> {
    this.runtimeStateService.incrementRequestCount();

    try {
      await this.captureSyncService.queueCapture({
        headerHash: input.headers ? createHash('sha256').update(JSON.stringify(input.headers)).digest('hex') : undefined,
        headers: input.headers,
        method: input.method,
        path: input.path,
        protocol: input.protocol,
        requestBody: input.requestBody,
        responseBody: input.responseBody,
        responseCode: input.responseCode,
        responseStrategy: input.responseStrategy ?? 'static',
        service: input.service,
        sourceIp: input.sourceIp,
        sourcePort: input.sourcePort,
        timestamp: new Date().toISOString(),
        tlsFingerprint: input.tlsFingerprint,
        userAgent: input.userAgent,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to queue ${input.protocol} capture for ${input.service} ${input.method} ${input.path ?? '/'}: ${this.toErrorMessage(error)}`,
      );
    }
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown failure';
  }
}