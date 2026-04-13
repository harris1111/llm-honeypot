import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { NodeSharedModule } from './node-shared.module';
import { OllamaController } from './protocols/ollama/ollama.controller';
import { OllamaService } from './protocols/ollama/ollama.service';
import { NodeLifecycleService } from './sync/node-lifecycle.service';

@Module({
  controllers: [AppController, OllamaController],
  imports: [NodeSharedModule],
  providers: [NodeLifecycleService, OllamaService],
})
export class AppModule {}