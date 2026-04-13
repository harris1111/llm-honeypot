import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { LangserveController } from './langserve.controller';
import { LangserveService } from './langserve.service';

@Module({
  controllers: [LangserveController],
  imports: [NodeSharedModule],
  providers: [LangserveService],
})
export class LangserveModule {}