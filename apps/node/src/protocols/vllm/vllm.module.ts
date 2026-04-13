import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { VllmController } from './vllm.controller';
import { VllmService } from './vllm.service';

@Module({
  controllers: [VllmController],
  imports: [NodeSharedModule],
  providers: [VllmService],
})
export class VllmModule {}