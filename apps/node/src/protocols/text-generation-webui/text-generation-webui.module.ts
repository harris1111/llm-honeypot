import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { TextGenerationWebuiController } from './text-generation-webui.controller';
import { TextGenerationWebuiService } from './text-generation-webui.service';

@Module({
  controllers: [TextGenerationWebuiController],
  imports: [NodeSharedModule],
  providers: [TextGenerationWebuiService],
})
export class TextGenerationWebuiModule {}