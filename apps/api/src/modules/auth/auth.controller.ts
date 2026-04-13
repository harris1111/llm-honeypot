import type { AuthenticatedUser } from '@llmtrap/shared';
import {
  enableTotpRequestSchema,
  loginRequestSchema,
  refreshSessionRequestSchema,
  registerRequestSchema,
  verifyTotpRequestSchema,
} from '@llmtrap/shared';
import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

type RequestWithIp = {
  ip: string;
};

@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;

  constructor(@Inject(AuthService) authService: AuthService) {
    this.authService = authService;
  }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: typeof loginRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.authService.login(body, request.ip);
  }

  @Post('enable-totp')
  @UseGuards(JwtAuthGuard)
  enableTotp(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(enableTotpRequestSchema)) body: typeof enableTotpRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.authService.enableTotp(user?.id ?? '', body.code, request.ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser | undefined) {
    return user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(refreshSessionRequestSchema)) body: typeof refreshSessionRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.authService.logout(user?.id ?? '', body, request.ip);
  }

  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(refreshSessionRequestSchema)) body: typeof refreshSessionRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.authService.refreshSession(body, request.ip);
  }

  @Post('setup-totp')
  @UseGuards(JwtAuthGuard)
  setupTotp(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.authService.setupTotp(user?.id ?? '');
  }

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: typeof registerRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.authService.registerFirstUser(body, request.ip);
  }

  @Post('verify-totp')
  verifyTotp(
    @Body(new ZodValidationPipe(verifyTotpRequestSchema)) body: typeof verifyTotpRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.authService.verifyTotp(body, request.ip);
  }
}