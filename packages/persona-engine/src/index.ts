import type { PersonaDefinition } from '@llmtrap/shared';

export interface PersonaSnapshot {
  enabledServices: string[];
  hostname: string;
  primaryModel: string;
}

export function createPersonaSnapshot(persona: PersonaDefinition): PersonaSnapshot {
  const enabledServices = Object.entries(persona.services)
    .filter(([, enabled]) => enabled)
    .map(([service]) => service)
    .sort();

  return {
    enabledServices,
    hostname: persona.identity.hostname,
    primaryModel: persona.models[0]?.name ?? 'unknown-model',
  };
}

export function createPersonaSummary(persona: PersonaDefinition): string {
  const snapshot = createPersonaSnapshot(persona);
  return `${snapshot.hostname} exposes ${snapshot.enabledServices.length} services and reports ${snapshot.primaryModel} as its primary model.`;
}