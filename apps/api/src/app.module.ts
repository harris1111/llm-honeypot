import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { apiConfig } from './config/env-config';
import { AuditModule } from './modules/audit/audit.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ActorsModule } from './modules/actors/actors.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaptureModule } from './modules/capture/capture.module';
import { ExportModule } from './modules/export/export.module';
import { HealthModule } from './modules/health/health.module';
import { LiveFeedModule } from './modules/live-feed/live-feed.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { PersonasModule } from './modules/personas/personas.module';
import { ResponseConfigModule } from './modules/response-config/response-config.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ThreatIntelModule } from './modules/threat-intel/threat-intel.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: apiConfig.env.JWT_SECRET,
    }),
    AlertsModule,
    AnalyticsModule,
    ActorsModule,
    AuditModule,
    AuthModule,
    CaptureModule,
    ExportModule,
    HealthModule,
    LiveFeedModule,
    NodesModule,
    PersonasModule,
    ResponseConfigModule,
    SessionsModule,
    TemplatesModule,
    ThreatIntelModule,
    UsersModule,
  ],
})
export class AppModule {}