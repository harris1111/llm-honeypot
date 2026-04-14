import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

import { RuntimeStateService } from '../runtime/runtime-state.service';
import { CaptureSyncService } from './capture-sync.service';

export type ProtocolRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method: string;
  originalUrl?: string;
  socket?: { remoteAddress?: string };
  url?: string;
};

@Injectable()
export class HttpCaptureService {
  private readonly logger = new Logger(HttpCaptureService.name);

  constructor(
    private readonly captureSyncService: CaptureSyncService,
    private readonly runtimeStateService: RuntimeStateService,
  ) {}

  async recordInteraction(input: {
    protocol: string;
    request: ProtocolRequest;
    responseBody: unknown;
    responseCode: number;
    responseStrategy: 'real_model' | 'static' | 'template';
    service: string;
  }): Promise<void> {
    this.runtimeStateService.incrementRequestCount();

    const headers = this.normalizeHeaders(input.request.headers);
    const forwarded = input.request.headers['x-forwarded-for'];
    const forwardedIp = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
    const sourceIp = forwardedIp || input.request.ip || input.request.socket?.remoteAddress || '0.0.0.0';

    try {
      await this.captureSyncService.queueCapture({
        headerHash: this.hashHeaders(headers),
        headers,
        method: input.request.method,
        path: input.request.originalUrl ?? input.request.url ?? '/',
        protocol: input.protocol,
        requestBody: input.request.body,
        responseBody: input.responseBody,
        responseCode: input.responseCode,
        responseStrategy: input.responseStrategy,
        service: input.service,
        sourceIp,
        timestamp: new Date().toISOString(),
        userAgent: this.readHeader(headers, 'user-agent'),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to queue capture for ${input.service} ${input.request.method} ${input.request.originalUrl ?? input.request.url ?? '/'}: ${this.toErrorMessage(error)}`,
      );
    }
  }

  private hashHeaders(headers: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(headers)).digest('hex');
  }

  private normalizeHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string | string[]> {
    return Object.entries(headers).reduce<Record<string, string | string[]>>((normalized, [key, value]) => {
      if (value === undefined) {
        return normalized;
      }

      normalized[key.toLowerCase()] = value;
      return normalized;
    }, {});
  }

  private readHeader(headers: Record<string, string | string[]>, name: string): string | undefined {
    const value = headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown failure';
  }
}