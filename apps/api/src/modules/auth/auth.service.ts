import { Prisma, prisma } from '@llmtrap/db';
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RefreshSessionRequest,
  RegisterRequest,
  SetupTotpResponse,
  TokenPair,
  VerifyTotpRequest,
} from '@llmtrap/shared';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';

import { apiConfig } from '../../config/env-config';
import { AuditService } from '../audit/audit.service';

interface JwtUserPayload {
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  sub: string;
  totpEnabled: boolean;
}

interface SessionTokens {
  expiresAt: Date;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<string, number[]>();
  private readonly auditService: AuditService;
  private readonly jwtService: JwtService;

  constructor(
    @Inject(AuditService) auditService: AuditService,
    @Inject(JwtService) jwtService: JwtService,
  ) {
    this.auditService = auditService;
    this.jwtService = jwtService;
  }

  async registerFirstUser(input: RegisterRequest, ipAddress?: string): Promise<LoginResponse> {
    const user = await this.createInitialAdmin(input);

    await this.auditService.record({
      action: 'auth.register-first-user',
      details: { email: user.email },
      ip: ipAddress,
      target: user.id,
      userId: user.id,
    });

    return this.issueLoginSuccess(user.id, user.email, user.role, user.totpEnabled);
  }

  private async createInitialAdmin(input: RegisterRequest) {
    const passwordHash = await hash(input.password, 12);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(
          async (transaction) => {
            const existingUsers = await transaction.user.count();
            if (existingUsers > 0) {
              throw new ForbiddenException('Initial registration is closed');
            }

            return transaction.user.create({
              data: {
                email: input.email.toLowerCase(),
                passwordHash,
                role: 'ADMIN',
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Initial registration is closed');
          }

          if (error.code === 'P2034' && attempt < 2) {
            continue;
          }
        }

        throw error;
      }
    }

    throw new ForbiddenException('Initial registration is closed');
  }

  async login(input: LoginRequest, ipAddress: string): Promise<LoginResponse> {
    this.enforceRateLimit(ipAddress);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !(await compare(input.password, user.passwordHash))) {
      this.recordFailedLogin(ipAddress);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginAttempts.delete(ipAddress);

    if (user.totpEnabled) {
      const tempToken = this.jwtService.sign(
        { kind: 'totp', sub: user.id },
        { expiresIn: '5m' },
      );
      return {
        requiresTotp: true,
        tempToken,
      };
    }

    await this.auditService.record({
      action: 'auth.login',
      ip: ipAddress,
      target: user.id,
      userId: user.id,
    });

    return this.issueLoginSuccess(user.id, user.email, user.role, user.totpEnabled);
  }

  async setupTotp(userId: string): Promise<SetupTotpResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = authenticator.generateSecret();

    await prisma.user.update({
      data: {
        totpEnabled: false,
        totpSecret: secret,
      },
      where: { id: userId },
    });

    return {
      manualEntryKey: secret,
      otpauthUrl: authenticator.keyuri(user.email, 'LLMTrap', secret),
    };
  }

  async enableTotp(userId: string, code: string, ipAddress?: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.totpSecret) {
      throw new UnauthorizedException('TOTP setup has not been initialized');
    }

    if (!authenticator.check(code, user.totpSecret)) {
      throw new UnauthorizedException('TOTP code is invalid');
    }

    const updatedUser = await prisma.user.update({
      data: {
        totpEnabled: true,
      },
      where: { id: userId },
    });

    await this.auditService.record({
      action: 'auth.enable-totp',
      ip: ipAddress,
      target: userId,
      userId,
    });

    return this.toAuthenticatedUser(updatedUser.id, updatedUser.email, updatedUser.role, updatedUser.totpEnabled);
  }

  async refreshSession(input: RefreshSessionRequest, ipAddress?: string): Promise<{ tokens: TokenPair; user: AuthenticatedUser }> {
    const refreshTokenHash = this.hashSecret(input.refreshToken);
    const session = await prisma.userSession.findUnique({
      include: { user: true },
      where: { refreshTokenHash },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await prisma.userSession.delete({ where: { id: session.id } });

    await this.auditService.record({
      action: 'auth.refresh',
      ip: ipAddress,
      target: session.userId,
      userId: session.userId,
    });

    const { tokens } = await this.createSessionTokens(session.userId, session.user.email, session.user.role, session.user.totpEnabled);

    return {
      tokens,
      user: this.toAuthenticatedUser(session.user.id, session.user.email, session.user.role, session.user.totpEnabled),
    };
  }

  async verifyTotp(input: VerifyTotpRequest, ipAddress?: string): Promise<LoginResponse> {
    let payload: { kind?: string; sub?: string };

    try {
      payload = this.jwtService.verify(input.tempToken) as { kind?: string; sub?: string };
    } catch {
      throw new UnauthorizedException('TOTP challenge is invalid or expired');
    }

    if (payload.kind !== 'totp' || !payload.sub) {
      throw new UnauthorizedException('TOTP challenge is invalid or expired');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException('TOTP is not enabled for this account');
    }

    if (!authenticator.check(input.code, user.totpSecret)) {
      throw new UnauthorizedException('TOTP code is invalid');
    }

    await this.auditService.record({
      action: 'auth.verify-totp',
      ip: ipAddress,
      target: user.id,
      userId: user.id,
    });

    return this.issueLoginSuccess(user.id, user.email, user.role, user.totpEnabled);
  }

  async logout(userId: string, input: RefreshSessionRequest, ipAddress?: string): Promise<{ success: true }> {
    const refreshTokenHash = this.hashSecret(input.refreshToken);

    await prisma.userSession.deleteMany({
      where: {
        refreshTokenHash,
        userId,
      },
    });

    await this.auditService.record({
      action: 'auth.logout',
      ip: ipAddress,
      target: userId,
      userId,
    });

    return { success: true };
  }

  private async createSessionTokens(
    userId: string,
    email: string,
    role: JwtUserPayload['role'],
    totpEnabled: boolean,
  ): Promise<SessionTokens> {
    const accessToken = this.jwtService.sign(
      { email, role, sub: userId, totpEnabled } satisfies JwtUserPayload,
      { expiresIn: `${apiConfig.auth.accessTokenTtlMinutes}m` },
    );

    const refreshToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + apiConfig.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await prisma.userSession.create({
      data: {
        expiresAt,
        refreshTokenHash: this.hashSecret(refreshToken),
        userId,
      },
    });

    return {
      expiresAt,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private enforceRateLimit(ipAddress: string): void {
    const recentAttempts = this.getRecentAttempts(ipAddress);
    if (recentAttempts.length >= 5) {
      throw new HttpException('Too many login attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private getRecentAttempts(ipAddress: string): number[] {
    const windowStart = Date.now() - 15 * 60 * 1000;
    const recentAttempts = (this.loginAttempts.get(ipAddress) ?? []).filter((attempt) => attempt >= windowStart);
    this.loginAttempts.set(ipAddress, recentAttempts);
    return recentAttempts;
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  private async issueLoginSuccess(
    userId: string,
    email: string,
    role: JwtUserPayload['role'],
    totpEnabled: boolean,
  ): Promise<LoginResponse> {
    const { tokens } = await this.createSessionTokens(userId, email, role, totpEnabled);

    return {
      requiresTotp: false,
      tokens,
      user: this.toAuthenticatedUser(userId, email, role, totpEnabled),
    };
  }

  private recordFailedLogin(ipAddress: string): void {
    const attempts = this.getRecentAttempts(ipAddress);
    attempts.push(Date.now());
    this.loginAttempts.set(ipAddress, attempts);
  }

  private toAuthenticatedUser(
    id: string,
    email: string,
    role: JwtUserPayload['role'],
    totpEnabled: boolean,
  ): AuthenticatedUser {
    return {
      email,
      id,
      role,
      totpEnabled,
    };
  }
}