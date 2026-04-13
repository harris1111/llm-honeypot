import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(@Inject(SessionsService) private readonly sessionsService: SessionsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') sessionId: string) {
    return this.sessionsService.getOne(sessionId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Query('classification') classification?: string,
    @Query('nodeId') nodeId?: string,
    @Query('service') service?: string,
  ) {
    return this.sessionsService.list({ classification, nodeId, service });
  }
}