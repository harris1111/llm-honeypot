import type { AuthenticatedUser } from '@llmtrap/shared';
import {
  createNodeRequestSchema,
  nodeHeartbeatSchema,
  nodeRegistrationRequestSchema,
  updateNodeRequestSchema,
} from '@llmtrap/shared';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NodesService } from './nodes.service';

type RequestWithIp = {
  ip: string;
};

@Controller('nodes')
export class NodesController {
  private readonly nodesService: NodesService;

  constructor(@Inject(NodesService) nodesService: NodesService) {
    this.nodesService = nodesService;
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approve(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') nodeId: string, @Req() request: RequestWithIp) {
    return this.nodesService.approve(user?.id ?? '', nodeId, request.ip);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body(new ZodValidationPipe(createNodeRequestSchema)) body: typeof createNodeRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.nodesService.create(user?.id ?? '', body, request.ip);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@CurrentUser() user: AuthenticatedUser | undefined, @Param('id') nodeId: string, @Req() request: RequestWithIp) {
    return this.nodesService.remove(user?.id ?? '', nodeId, request.ip);
  }

  @Get(':id/config')
  getConfig(@Param('id') nodeId: string, @Headers('x-node-key') nodeKey?: string) {
    return this.nodesService.getConfig(nodeId, this.requireNodeKey(nodeKey));
  }

  @Post(':id/heartbeat')
  heartbeat(
    @Param('id') nodeId: string,
    @Headers('x-node-key') nodeKey: string | undefined,
    @Body(new ZodValidationPipe(nodeHeartbeatSchema)) body: typeof nodeHeartbeatSchema['_type'],
  ) {
    return this.nodesService.recordHeartbeat(nodeId, this.requireNodeKey(nodeKey), body);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') nodeId: string) {
    return this.nodesService.getOne(nodeId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return this.nodesService.list();
  }

  @Post('register')
  register(@Body(new ZodValidationPipe(nodeRegistrationRequestSchema)) body: typeof nodeRegistrationRequestSchema['_type']) {
    return this.nodesService.register(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') nodeId: string,
    @Body(new ZodValidationPipe(updateNodeRequestSchema)) body: typeof updateNodeRequestSchema['_type'],
    @Req() request: RequestWithIp,
  ) {
    return this.nodesService.update(user?.id ?? '', nodeId, body, request.ip);
  }

  private requireNodeKey(nodeKey: string | undefined): string {
    if (!nodeKey) {
      throw new ForbiddenException('Missing x-node-key header');
    }

    return nodeKey;
  }
}