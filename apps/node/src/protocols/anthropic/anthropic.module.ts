import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { AnthropicController } from './anthropic.controller';
import { AnthropicService } from './anthropic.service';

@Module({
  controllers: [AnthropicController],
  imports: [NodeSharedModule],
  providers: [AnthropicService],
})
export class AnthropicModule {}