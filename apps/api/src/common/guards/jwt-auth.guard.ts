import type { AuthenticatedUser, UserRole } from '@llmtrap/shared';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AccessTokenPayload {
  email: string;
  role: UserRole;
  sub: string;
  totpEnabled?: boolean;
}

type RequestWithUser = {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtService: JwtService;

  constructor(@Inject(JwtService) jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      request.user = {
        email: payload.email,
        id: payload.sub,
        role: payload.role,
        totpEnabled: payload.totpEnabled ?? false,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(header: string | string[] | undefined): string | null {
    if (typeof header !== 'string') {
      return null;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}