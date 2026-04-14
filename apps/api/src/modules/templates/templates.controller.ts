import type { AuthenticatedUser } from '@llmtrap/shared';
import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { manualBackfeedRequestSchema } from './templates.schemas';
import { TemplatesService } from './templates.service';

type RequestWithIp = { ip: string };

@Controller('templates')
export class TemplatesController {
  constructor(@Inject(TemplatesService) private readonly templatesService: TemplatesService) {}

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approve(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') templateId: string, @Req() request: RequestWithIp) {
    return this.templatesService.approve(user?.id ?? '', templateId, request.ip);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query('reviewQueue') reviewQueue?: string) {
    return this.templatesService.list(reviewQueue === 'true');
  }

  @Post('backfeed/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  manualBackfeed(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(manualBackfeedRequestSchema)) body: typeof manualBackfeedRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.templatesService.manualBackfeed(user?.id ?? '', body, request.ip);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reject(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') templateId: string, @Req() request: RequestWithIp) {
    return this.templatesService.reject(user?.id ?? '', templateId, request.ip);
  }
}