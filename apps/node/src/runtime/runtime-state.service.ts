import type {
  NodeConfig,
  NodeHeartbeat,
  NodeRecord,
  NodeRegistrationResponse,
  PersonaDefinition,
} from '@llmtrap/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RuntimeStateService {
  private static readonly store: {
    config: Record<string, unknown>;
    lastSyncError: string | null;
    node: NodeRecord | null;
    persona: PersonaDefinition | null;
    requestCount: number;
  } = {
    config: {},
    lastSyncError: null,
    node: null,
    persona: null,
    requestCount: 0,
  };

  applyConfig(nextConfig: NodeConfig): void {
    RuntimeStateService.store.config = nextConfig.config;
    RuntimeStateService.store.node = nextConfig.node;
    RuntimeStateService.store.persona = nextConfig.persona;
  }

  applyRegistration(response: NodeRegistrationResponse): void {
    RuntimeStateService.store.node = response.node;

    if (response.config) {
      this.applyConfig(response.config);
    }
  }

  buildHeartbeat(bufferSize: number): NodeHeartbeat {
    if (!RuntimeStateService.store.node?.id) {
      throw new Error('Node is not registered');
    }

    return {
      bufferSize,
      nodeId: RuntimeStateService.store.node.id,
      receivedAt: new Date().toISOString(),
      requestCount: RuntimeStateService.store.requestCount,
    };
  }

  clearSyncError(): void {
    RuntimeStateService.store.lastSyncError = null;
  }

  getConfig(): Record<string, unknown> {
    return RuntimeStateService.store.config;
  }

  getHealth(bufferSize: number) {
    return {
      bufferSize,
      service: 'node',
      status: this.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  getNode(): NodeRecord | null {
    return RuntimeStateService.store.node;
  }

  getStatus(): string {
    return RuntimeStateService.store.node?.status ?? 'BOOTING';
  }

  getNodeId(): string | null {
    return RuntimeStateService.store.node?.id ?? null;
  }

  getPersona(): PersonaDefinition | null {
    return RuntimeStateService.store.persona;
  }

  incrementRequestCount(): void {
    RuntimeStateService.store.requestCount += 1;
  }

  markSyncError(error: unknown): void {
    RuntimeStateService.store.lastSyncError = error instanceof Error ? error.message : 'Unknown sync failure';
  }
}