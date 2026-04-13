import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { LmStudioController } from './lm-studio.controller';
import { LmStudioService } from './lm-studio.service';

@Module({
  controllers: [LmStudioController],
  imports: [NodeSharedModule],
  providers: [LmStudioService],
})
export class LmStudioModule {}