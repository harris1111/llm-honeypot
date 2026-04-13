import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { LlamacppController } from './llamacpp.controller';
import { LlamacppService } from './llamacpp.service';

@Module({
  controllers: [LlamacppController],
  imports: [NodeSharedModule],
  providers: [LlamacppService],
})
export class LlamacppModule {}