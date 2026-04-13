import type { AuthenticatedUser } from '@llmtrap/shared';
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createUserSchema, updateUserSchema, UsersService } from './users.service';

type RequestWithIp = {
  ip: string;
};

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(createUserSchema)) body: typeof createUserSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.usersService.create(user?.id ?? '', body, request.ip);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') userId: string, @Req() request: RequestWithIp) {
    return this.usersService.remove(user?.id ?? '', userId, request.ip);
  }

  @Get()
  list() {
    return this.usersService.list();
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: typeof updateUserSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.usersService.update(user?.id ?? '', userId, body, request.ip);
  }
}