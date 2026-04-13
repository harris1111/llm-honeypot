import type { AuthenticatedUser } from '@llmtrap/shared';
import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';

type RequestWithIp = { ip: string };

function normalizeDays(days?: string): number {
  const value = Number(days);
  return Number.isFinite(value) && value > 0 ? value : 7;
}

function normalizeDataFormat(format?: string): 'csv' | 'json' {
  return format === 'csv' ? 'csv' : 'json';
}

function normalizeReportFormat(format?: string): 'html' | 'json' | 'markdown' {
  if (format === 'html' || format === 'json') {
    return format;
  }

  return 'markdown';
}

@Controller('export')
export class ExportController {
  constructor(@Inject(ExportService) private readonly exportService: ExportService) {}

  @Get('data')
  @UseGuards(JwtAuthGuard)
  getData(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('days') days?: string,
    @Query('format') format?: string,
    @Req() request?: RequestWithIp,
  ) {
    return this.exportService.getData(user?.id ?? '', normalizeDataFormat(format), normalizeDays(days), request?.ip);
  }

  @Get('report')
  @UseGuards(JwtAuthGuard)
  getReport(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('days') days?: string,
    @Query('format') format?: string,
    @Req() request?: RequestWithIp,
  ) {
    return this.exportService.getReport(user?.id ?? '', normalizeReportFormat(format), normalizeDays(days), request?.ip);
  }
}