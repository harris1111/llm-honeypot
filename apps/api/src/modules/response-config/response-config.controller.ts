import type { AuthenticatedUser } from '@llmtrap/shared';
import { Body, Controller, Get, Inject, Param, Put, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { responseConfigSchema } from './response-config.schemas';
import { ResponseConfigService } from './response-config.service';

type RequestWithIp = { ip: string };

@Controller('response-config')
export class ResponseConfigController {
  constructor(@Inject(ResponseConfigService) private readonly responseConfigService: ResponseConfigService) {}

  @Get(':nodeId')
  @UseGuards(JwtAuthGuard)
  get(@Param('nodeId') nodeId: string) {
    return this.responseConfigService.get(nodeId);
  }

  @Put(':nodeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('nodeId') nodeId: string,
    @Body(new ZodValidationPipe(responseConfigSchema)) body: typeof responseConfigSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.responseConfigService.update(user?.id ?? '', nodeId, body, request.ip);
  }
}