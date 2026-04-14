import type { TemplateDefinition } from '@llmtrap/response-engine';
import type {
  NodeConfig,
  NodeHeartbeat,
  NodeRecord,
  NodeRegistrationResponse,
  PersonaDefinition,
  ResponseConfigRecord,
} from '@llmtrap/shared';
import { defaultResponseConfig, responseConfigSchema } from '@llmtrap/shared';
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

  getResponseConfig(): ResponseConfigRecord {
    const parsed = responseConfigSchema.safeParse(RuntimeStateService.store.config.responseConfig ?? {});
    return parsed.success ? parsed.data : defaultResponseConfig;
  }

  getResponseTemplates(): TemplateDefinition[] {
    const rawTemplates = RuntimeStateService.store.config.responseTemplates;
    if (!Array.isArray(rawTemplates)) {
      return [];
    }

    return rawTemplates.filter(isTemplateDefinition);
  }

  incrementRequestCount(): void {
    RuntimeStateService.store.requestCount += 1;
  }

  markSyncError(error: unknown): void {
    RuntimeStateService.store.lastSyncError = error instanceof Error ? error.message : 'Unknown sync failure';
  }
}

function isTemplateDefinition(value: unknown): value is TemplateDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const template = value as Partial<TemplateDefinition>;
  return Boolean(
    template.id &&
      template.category &&
      Array.isArray(template.keywords) &&
      template.keywords.every((keyword) => typeof keyword === 'string' && keyword.trim().length > 0) &&
      typeof template.responseText === 'string' &&
      template.responseText.trim().length > 0,
  );
}