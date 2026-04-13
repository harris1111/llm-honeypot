import { prisma } from '@llmtrap/db';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../src/modules/audit/audit.service';
import { AuthService } from '../src/modules/auth/auth.service';

function createService() {
  const auditService = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET,
  });

  return {
    auditService,
    service: new AuthService(auditService, jwtService),
  };
}

describe('AuthService', () => {
  it('returns a temporary TOTP challenge for users with TOTP enabled', async () => {
    const password = 'super-secret-password';
    const passwordHash = await hash(password, 12);
    const findUniqueMock = vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'admin@example.com',
      id: 'user-123',
      passwordHash,
      role: 'ADMIN',
      totpEnabled: true,
    } as never);
    const createSessionMock = vi.mocked(prisma.userSession.create).mockResolvedValue({
      id: 'session-123',
    } as never);
    const { auditService, service } = createService();

    const result = await service.login(
      {
        email: 'Admin@Example.com',
        password,
      },
      '203.0.113.10',
    );

    expect(result).toEqual({
      requiresTotp: true,
      tempToken: expect.any(String),
    });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('rotates refresh sessions and issues a fresh token pair', async () => {
    const findSessionMock = vi.mocked(prisma.userSession.findUnique).mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      id: 'session-123',
      user: {
        email: 'admin@example.com',
        id: 'user-123',
        role: 'ADMIN',
        totpEnabled: false,
      },
      userId: 'user-123',
    } as never);
    const deleteSessionMock = vi.mocked(prisma.userSession.delete).mockResolvedValue({
      id: 'session-123',
    } as never);
    const createSessionMock = vi.mocked(prisma.userSession.create).mockResolvedValue({
      id: 'session-456',
    } as never);
    const { auditService, service } = createService();

    const result = await service.refreshSession(
      {
        refreshToken: 'old-refresh-token',
      },
      '203.0.113.10',
    );

    expect(findSessionMock).toHaveBeenCalledWith({
      include: { user: true },
      where: {
        refreshTokenHash: expect.any(String),
      },
    });
    expect(deleteSessionMock).toHaveBeenCalledWith({
      where: { id: 'session-123' },
    });
    expect(createSessionMock).toHaveBeenCalledWith({
      data: {
        expiresAt: expect.any(Date),
        refreshTokenHash: expect.any(String),
        userId: 'user-123',
      },
    });
    expect(result).toEqual({
      tokens: {
        accessToken: expect.any(String),
        refreshToken: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
      user: {
        email: 'admin@example.com',
        id: 'user-123',
        role: 'ADMIN',
        totpEnabled: false,
      },
    });
    expect(auditService.record).toHaveBeenCalledWith({
      action: 'auth.refresh',
      ip: '203.0.113.10',
      target: 'user-123',
      userId: 'user-123',
    });
  });

  it('blocks repeated failed logins from the same IP address', async () => {
    const findUniqueMock = vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const { auditService, service } = createService();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.login(
          {
            email: 'admin@example.com',
            password: 'wrong-password',
          },
          '203.0.113.10',
        ),
      ).rejects.toThrow('Invalid email or password');
    }

    await expect(
      service.login(
        {
          email: 'admin@example.com',
          password: 'wrong-password',
        },
        '203.0.113.10',
      ),
    ).rejects.toThrow('Too many login attempts. Try again later.');

    expect(findUniqueMock).toHaveBeenCalledTimes(5);
    expect(auditService.record).not.toHaveBeenCalled();
  });
});