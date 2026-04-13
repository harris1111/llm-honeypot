import {
  nodeConfigSchema,
  nodeRegistrationResponseSchema,
  type ApiEnvelope,
  type CaptureRecord,
  type NodeConfig,
  type NodeHeartbeat,
  type NodeRegistrationResponse,
} from '@llmtrap/shared';
import { Inject, Injectable } from '@nestjs/common';
import { hostname } from 'node:os';

import { NODE_RUNTIME_CONFIG } from '../config/node-runtime-config';
import type { NodeRuntimeConfig } from '../config/node-runtime-config';

@Injectable()
export class DashboardApiService {
  constructor(@Inject(NODE_RUNTIME_CONFIG) private readonly config: NodeRuntimeConfig) {}

  async fetchNodeConfig(nodeId: string): Promise<NodeConfig> {
    return this.request(`/api/v1/nodes/${nodeId}/config`, { headers: this.authHeaders() }, (data) =>
      nodeConfigSchema.parse(data),
    );
  }

  async registerNode(): Promise<NodeRegistrationResponse> {
    return this.request(
      '/api/v1/nodes/register',
      {
        body: JSON.stringify({
          hostname: hostname(),
          nodeKey: this.config.nodeKey,
          services: this.config.serviceList,
          version: this.config.version,
        }),
        headers: this.jsonHeaders(),
        method: 'POST',
      },
      (data) => nodeRegistrationResponseSchema.parse(data),
    );
  }

  async sendHeartbeat(nodeId: string, heartbeat: NodeHeartbeat): Promise<void> {
    await this.request(
      `/api/v1/nodes/${nodeId}/heartbeat`,
      {
        body: JSON.stringify(heartbeat),
        headers: this.jsonHeaders(this.authHeaders()),
        method: 'POST',
      },
      (data) => data,
    );
  }

  async uploadCaptures(nodeId: string, records: CaptureRecord[]): Promise<void> {
    await this.request(
      '/api/v1/capture/batch',
      {
        body: JSON.stringify({ nodeId, records }),
        headers: this.jsonHeaders(this.authHeaders()),
        method: 'POST',
      },
      (data) => data,
    );
  }

  private authHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      'x-node-key': this.config.nodeKey,
    };
  }

  private jsonHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      'content-type': 'application/json',
    };
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    parse: (data: unknown) => T,
  ): Promise<T> {
    const response = await fetch(new URL(path, this.config.dashboardUrl), init);
    const payload = await this.readPayload(response);

    if (!response.ok) {
      throw new Error(this.readError(payload, response.statusText));
    }

    if (!payload || typeof payload !== 'object' || !('data' in payload) || !('error' in payload)) {
      throw new Error('Dashboard returned an invalid response envelope');
    }

    const envelope = payload as ApiEnvelope<unknown>;
    if (envelope.error) {
      throw new Error(envelope.error.message);
    }

    return parse(envelope.data);
  }

  private readError(payload: unknown, fallback: string): string {
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const error = (payload as { error?: { message?: string } | null }).error;
      if (error?.message) {
        return error.message;
      }
    }

    return fallback;
  }

  private async readPayload(response: Response): Promise<unknown> {
    const raw = await response.text();
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as unknown;
  }
}