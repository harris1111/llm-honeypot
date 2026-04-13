import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { OpenAiController } from './openai.controller';
import { OpenAiService } from './openai.service';

@Module({
  controllers: [OpenAiController],
  imports: [NodeSharedModule],
  providers: [OpenAiService],
})
export class OpenAiModule {}