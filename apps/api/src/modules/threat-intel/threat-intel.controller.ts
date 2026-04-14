import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ThreatIntelService } from './threat-intel.service';
import { threatIntelFiltersSchema, type ThreatIntelFilters } from './threat-intel.schemas';

@Controller('threat-intel')
export class ThreatIntelController {
  constructor(@Inject(ThreatIntelService) private readonly threatIntelService: ThreatIntelService) {}

  @Get('blocklist')
  @UseGuards(JwtAuthGuard)
  blocklist(@Query(new ZodValidationPipe(threatIntelFiltersSchema)) query: ThreatIntelFilters) {
    return this.threatIntelService.getBlocklist(query);
  }

  @Get('ioc')
  @UseGuards(JwtAuthGuard)
  ioc(@Query(new ZodValidationPipe(threatIntelFiltersSchema)) query: ThreatIntelFilters) {
    return this.threatIntelService.getIocFeed(query);
  }

  @Get('mitre')
  @UseGuards(JwtAuthGuard)
  mitre(@Query(new ZodValidationPipe(threatIntelFiltersSchema)) query: ThreatIntelFilters) {
    return this.threatIntelService.getMitreSummary(query);
  }

  @Get('stix')
  @UseGuards(JwtAuthGuard)
  stix(@Query(new ZodValidationPipe(threatIntelFiltersSchema)) query: ThreatIntelFilters) {
    return this.threatIntelService.getStixBundle(query);
  }
}