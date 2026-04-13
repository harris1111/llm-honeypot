import { Prisma, prisma } from '@llmtrap/db';
import { NotFoundException } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { CreatePersonaRequest, UpdatePersonaRequest } from './personas.schemas';

type PersonaRecord = {
  configFiles: Record<string, boolean>;
  createdAt: string;
  credentials: Record<string, string>;
  hardware: unknown;
  id: string;
  identity: unknown;
  models: unknown;
  name: string;
  preset: string | null;
  services: Record<string, boolean>;
  timing: unknown;
  updatedAt: string;
};

@Injectable()
export class PersonasService {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  async create(currentUserId: string, input: CreatePersonaRequest, ipAddress?: string): Promise<PersonaRecord> {
    const created = await prisma.persona.create({
      data: this.toCreateInput(input),
    });

    await this.auditService.record({
      action: 'personas.create',
      ip: ipAddress,
      target: created.id,
      userId: currentUserId,
    });

    return this.serialize(created);
  }

  async getOne(personaId: string): Promise<PersonaRecord> {
    const persona = await prisma.persona.findUnique({ where: { id: personaId } });
    if (!persona) {
      throw new NotFoundException('Persona not found');
    }

    return this.serialize(persona);
  }

  async list(): Promise<PersonaRecord[]> {
    const personas = await prisma.persona.findMany({ orderBy: { createdAt: 'asc' } });
    return personas.map((persona) => this.serialize(persona));
  }

  async remove(currentUserId: string, personaId: string, ipAddress?: string): Promise<{ success: true }> {
    await this.getOne(personaId);
    await prisma.persona.delete({ where: { id: personaId } });

    await this.auditService.record({
      action: 'personas.delete',
      ip: ipAddress,
      target: personaId,
      userId: currentUserId,
    });

    return { success: true };
  }

  async update(
    currentUserId: string,
    personaId: string,
    input: UpdatePersonaRequest,
    ipAddress?: string,
  ): Promise<PersonaRecord> {
    await this.getOne(personaId);
    const updated = await prisma.persona.update({
      data: this.toUpdateInput(input),
      where: { id: personaId },
    });

    await this.auditService.record({
      action: 'personas.update',
      ip: ipAddress,
      target: updated.id,
      userId: currentUserId,
    });

    return this.serialize(updated);
  }

  private serialize(persona: Prisma.PersonaGetPayload<Record<string, never>>): PersonaRecord {
    return {
      configFiles: persona.configFiles as Record<string, boolean>,
      createdAt: persona.createdAt.toISOString(),
      credentials: persona.credentials as Record<string, string>,
      hardware: persona.hardware,
      id: persona.id,
      identity: persona.identity,
      models: persona.models,
      name: persona.name,
      preset: persona.preset,
      services: persona.services as Record<string, boolean>,
      timing: persona.timing,
      updatedAt: persona.updatedAt.toISOString(),
    };
  }

  private toCreateInput(input: CreatePersonaRequest): Prisma.PersonaUncheckedCreateInput {
    return {
      configFiles: input.configFiles as Prisma.InputJsonValue,
      credentials: input.credentials as Prisma.InputJsonValue,
      hardware: input.hardware as Prisma.InputJsonValue,
      identity: input.identity as Prisma.InputJsonValue,
      models: input.models as Prisma.InputJsonValue,
      name: input.name,
      preset: input.preset,
      services: input.services as Prisma.InputJsonValue,
      timing: input.timing as Prisma.InputJsonValue,
    };
  }

  private toUpdateInput(input: UpdatePersonaRequest): Prisma.PersonaUncheckedUpdateInput {
    return {
      configFiles: input.configFiles as Prisma.InputJsonValue | undefined,
      credentials: input.credentials as Prisma.InputJsonValue | undefined,
      hardware: input.hardware as Prisma.InputJsonValue | undefined,
      identity: input.identity as Prisma.InputJsonValue | undefined,
      models: input.models as Prisma.InputJsonValue | undefined,
      name: input.name,
      preset: input.preset,
      services: input.services as Prisma.InputJsonValue | undefined,
      timing: input.timing as Prisma.InputJsonValue | undefined,
    };
  }
}