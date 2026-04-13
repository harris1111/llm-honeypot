import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ThreatIntelService } from './threat-intel.service';

@Controller('threat-intel')
export class ThreatIntelController {
  constructor(@Inject(ThreatIntelService) private readonly threatIntelService: ThreatIntelService) {}

  @Get('blocklist')
  @UseGuards(JwtAuthGuard)
  blocklist() {
    return this.threatIntelService.getBlocklist();
  }

  @Get('ioc')
  @UseGuards(JwtAuthGuard)
  ioc() {
    return this.threatIntelService.getIocFeed();
  }

  @Get('mitre')
  @UseGuards(JwtAuthGuard)
  mitre() {
    return this.threatIntelService.getMitreSummary();
  }

  @Get('stix')
  @UseGuards(JwtAuthGuard)
  stix() {
    return this.threatIntelService.getStixBundle();
  }
}