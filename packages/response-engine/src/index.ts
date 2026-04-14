import type { ModelDescriptor, PersonaDefinition, ProtocolService } from '@llmtrap/shared';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TemplateDefinition {
  id: string;
  category: string;
  keywords: string[];
  responseText: string;
  services?: string[];
}

export interface RoutedResponse {
  content: string;
  modelName: string;
  strategy: 'static' | 'template';
  templateId: string | null;
}

export function createFallbackResponse(
  service: ProtocolService,
  model: ModelDescriptor | undefined,
  persona?: PersonaDefinition | null,
): RoutedResponse {
  const modelName = model?.name ?? 'llmtrap-placeholder';
  return {
    content: `LLMTrap placeholder response for ${service}. Model ${modelName} is ready on ${persona?.identity.hostname ?? 'llmtrap-node'}.`,
    modelName,
    strategy: 'static',
    templateId: null,
  };
}

const defaultTemplates: TemplateDefinition[] = [
  {
    category: 'default',
    id: 'default-greeting',
    keywords: ['hello', 'hi', 'hey'],
    responseText: 'Hello. {{modelName}} is online on {{hostname}} with {{gpuModel}} available.',
  },
];

export function loadTemplates(templateDirectory = resolve(process.cwd(), 'templates')): TemplateDefinition[] {
  if (!existsSync(templateDirectory)) {
    return defaultTemplates;
  }

  const templates = readdirSync(templateDirectory)
    .filter((entry) => entry.endsWith('.json'))
    .flatMap((entry) => readTemplateFile(resolve(templateDirectory, entry)));

  return templates.length > 0 ? templates : defaultTemplates;
}

export function routeTemplateResponse(options: {
  modelName?: string;
  persona?: PersonaDefinition | null;
  prompt: string;
  service: ProtocolService;
  templateDirectory?: string;
  templates?: TemplateDefinition[];
}): RoutedResponse {
  const persona = options.persona ?? null;
  const model = resolveModel(persona, options.modelName);
  const templates = [...(options.templates ?? []), ...loadTemplates(options.templateDirectory)].filter(
    (template) => !template.services || template.services.includes(options.service),
  );
  const matchedTemplate = findBestTemplate(options.prompt, templates);

  if (!matchedTemplate) {
    return createFallbackResponse(options.service, model, persona);
  }

  return {
    content: substituteVariables(matchedTemplate.responseText, persona, model),
    modelName: model?.name ?? options.modelName ?? 'llmtrap-placeholder',
    strategy: 'template',
    templateId: matchedTemplate.id,
  };
}

export function splitResponseChunks(content: string): string[] {
  const chunks = content.match(/\S+\s*/g) ?? [content];
  return chunks.length > 0 ? chunks : [content];
}

function findBestTemplate(prompt: string, templates: TemplateDefinition[]): TemplateDefinition | null {
  const promptTokens = new Set(tokenize(prompt));
  let bestTemplate: TemplateDefinition | null = null;
  let bestScore = 0;

  for (const template of templates) {
    const templateTokens = new Set(tokenize(template.keywords.join(' ')));
    const overlap = [...promptTokens].filter((token) => templateTokens.has(token)).length;
    const score = overlap / Math.max(templateTokens.size, 1);

    if (score >= 0.3 && score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

function readTemplateFile(filePath: string): TemplateDefinition[] {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  const entries = Array.isArray(parsed) ? parsed : [parsed];

  return entries.filter(isTemplateDefinition);
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
      template.keywords.every((keyword) => typeof keyword === 'string') &&
      template.responseText,
  );
}

function resolveModel(persona: PersonaDefinition | null, modelName?: string): ModelDescriptor | undefined {
  if (!persona?.models?.length) {
    return modelName
      ? { family: 'llama', name: modelName, parameterSize: '8B', sizeGb: 4 }
      : undefined;
  }

  return persona.models.find((model) => model.name === modelName) ?? persona.models[0];
}

function substituteVariables(
  template: string,
  persona: PersonaDefinition | null,
  model: ModelDescriptor | undefined,
): string {
  return template
    .replaceAll('{{gpuModel}}', persona?.hardware.gpu ?? 'unknown GPU')
    .replaceAll('{{hostname}}', persona?.identity.hostname ?? 'llmtrap-node')
    .replaceAll('{{modelName}}', model?.name ?? 'llmtrap-placeholder')
    .replaceAll('{{username}}', persona?.identity.username ?? 'operator');
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}