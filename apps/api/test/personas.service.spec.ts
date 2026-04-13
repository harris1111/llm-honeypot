import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../src/modules/audit/audit.service';
import { PersonasService } from '../src/modules/personas/personas.service';

function createService() {
  const auditService = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  return {
    auditService,
    service: new PersonasService(auditService),
  };
}

describe('PersonasService', () => {
  it('creates personas and records an audit entry', async () => {
    vi.mocked(prisma.persona.create).mockResolvedValue({
      configFiles: { '.env': true },
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
      credentials: { openai: 'sk-proj-test' },
      hardware: { gpu: 'NVIDIA L4' },
      id: 'persona-123',
      identity: { hostname: 'trap-node-01' },
      models: [{ name: 'llama-3.1' }],
      name: 'Research Persona',
      preset: 'researcher',
      services: { openai: true },
      timing: { uptimeDays: [3, 12] },
      updatedAt: new Date('2026-04-13T12:00:00.000Z'),
    } as never);
    const { auditService, service } = createService();

    const result = await service.create(
      'user-123',
      {
        configFiles: { '.env': true },
        credentials: { openai: 'sk-proj-test' },
        hardware: { gpu: 'NVIDIA L4' },
        identity: { hostname: 'trap-node-01' },
        models: [{ name: 'llama-3.1' }],
        name: 'Research Persona',
        preset: 'researcher',
        services: { openai: true },
        timing: { uptimeDays: [3, 12] },
      } as never,
      '203.0.113.10',
    );

    expect(result.id).toBe('persona-123');
    expect(auditService.record).toHaveBeenCalledWith({
      action: 'personas.create',
      ip: '203.0.113.10',
      target: 'persona-123',
      userId: 'user-123',
    });
  });

  it('lists personas in serialized form', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        configFiles: {},
        createdAt: new Date('2026-04-13T12:00:00.000Z'),
        credentials: {},
        hardware: {},
        id: 'persona-123',
        identity: { hostname: 'trap-node-01' },
        models: [],
        name: 'Research Persona',
        preset: null,
        services: {},
        timing: {},
        updatedAt: new Date('2026-04-13T12:00:00.000Z'),
      },
    ] as never);
    const { service } = createService();

    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'persona-123',
        name: 'Research Persona',
      }),
    ]);
  });
});