import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { apiConfig } from './config/env-config';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaptureModule } from './modules/capture/capture.module';
import { HealthModule } from './modules/health/health.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: apiConfig.env.JWT_SECRET,
    }),
    AuditModule,
    AuthModule,
    CaptureModule,
    HealthModule,
    NodesModule,
    UsersModule,
  ],
})
export class AppModule {}