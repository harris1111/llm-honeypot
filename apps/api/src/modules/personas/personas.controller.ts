import type { AuthenticatedUser } from '@llmtrap/shared';
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createPersonaRequestSchema, updatePersonaRequestSchema } from './personas.schemas';
import { PersonasService } from './personas.service';

type RequestWithIp = { ip: string };

@Controller('personas')
export class PersonasController {
  constructor(@Inject(PersonasService) private readonly personasService: PersonasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(createPersonaRequestSchema)) body: typeof createPersonaRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.personasService.create(user?.id ?? '', body, request.ip);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') personaId: string, @Req() request: RequestWithIp) {
    return this.personasService.remove(user?.id ?? '', personaId, request.ip);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') personaId: string) {
    return this.personasService.getOne(personaId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return this.personasService.list();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') personaId: string,
    @Body(new ZodValidationPipe(updatePersonaRequestSchema)) body: typeof updatePersonaRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.personasService.update(user?.id ?? '', personaId, body, request.ip);
  }
}