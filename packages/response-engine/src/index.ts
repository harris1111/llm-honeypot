import type { ModelDescriptor, ProtocolService } from '@llmtrap/shared';

export interface TemplateDefinition {
  id: string;
  category: string;
  keywords: string[];
  responseText: string;
}

export interface RoutedResponse {
  content: string;
  modelName: string;
  strategy: 'static' | 'template';
}

export function createFallbackResponse(
  service: ProtocolService,
  model: ModelDescriptor | undefined,
): RoutedResponse {
  const modelName = model?.name ?? 'llmtrap-placeholder';
  return {
    content: `LLMTrap placeholder response for ${service}. Model ${modelName} is ready for Phase 3 protocol emulation.`,
    modelName,
    strategy: 'static',
  };
}