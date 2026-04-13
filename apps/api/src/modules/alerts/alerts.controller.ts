import type { AuthenticatedUser } from '@llmtrap/shared';
import { Body, Controller, Delete, Get, Inject, Param, Put, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AlertsService } from './alerts.service';
import { alertRuleSchema } from './alerts.schemas';

type RequestWithIp = { ip: string };

@Controller('alerts')
export class AlertsController {
  constructor(@Inject(AlertsService) private readonly alertsService: AlertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(alertRuleSchema)) body: typeof alertRuleSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.alertsService.create(user?.id ?? '', body, request.ip);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') ruleId: string, @Req() request: RequestWithIp) {
    return this.alertsService.remove(user?.id ?? '', ruleId, request.ip);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  logs() {
    return this.alertsService.listLogs();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return this.alertsService.listRules();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') ruleId: string,
    @Body(new ZodValidationPipe(alertRuleSchema)) body: typeof alertRuleSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.alertsService.update(user?.id ?? '', ruleId, body, request.ip);
  }
}