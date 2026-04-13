import { personaDefinitionSchema } from '@llmtrap/shared';

export const createPersonaRequestSchema = personaDefinitionSchema;

export const updatePersonaRequestSchema = personaDefinitionSchema.partial();

export type CreatePersonaRequest = typeof createPersonaRequestSchema['_type'];

export type UpdatePersonaRequest = typeof updatePersonaRequestSchema['_type'];