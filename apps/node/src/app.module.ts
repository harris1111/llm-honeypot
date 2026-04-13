import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { NodeSharedModule } from './node-shared.module';
import { IdeConfigsController } from './protocols/ide-configs/ide-configs.controller';
import { IdeConfigsService } from './protocols/ide-configs/ide-configs.service';
import { McpController } from './protocols/mcp/mcp.controller';
import { McpService } from './protocols/mcp/mcp.service';
import { OllamaController } from './protocols/ollama/ollama.controller';
import { OllamaService } from './protocols/ollama/ollama.service';
import { ProtocolServerManagerService } from './protocols/protocol-server-manager.service';
import { NodeLifecycleService } from './sync/node-lifecycle.service';

@Module({
  controllers: [AppController, OllamaController, McpController, IdeConfigsController],
  imports: [NodeSharedModule],
  providers: [NodeLifecycleService, OllamaService, McpService, IdeConfigsService, ProtocolServerManagerService],
})
export class AppModule {}