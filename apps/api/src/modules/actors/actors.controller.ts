import type { AuthenticatedUser } from '@llmtrap/shared';
import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ActorsService } from './actors.service';
import { mergeActorsRequestSchema, splitActorRequestSchema } from './actors.schemas';

type RequestWithIp = { ip: string };

@Controller('actors')
export class ActorsController {
  constructor(@Inject(ActorsService) private readonly actorsService: ActorsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') actorId: string) {
    return this.actorsService.getOne(actorId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return this.actorsService.list();
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  merge(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(mergeActorsRequestSchema)) body: typeof mergeActorsRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.actorsService.merge(user?.id ?? '', body, request.ip);
  }

  @Post(':id/split')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  split(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') actorId: string,
    @Body(new ZodValidationPipe(splitActorRequestSchema)) body: typeof splitActorRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.actorsService.split(user?.id ?? '', actorId, body, request.ip);
  }
}