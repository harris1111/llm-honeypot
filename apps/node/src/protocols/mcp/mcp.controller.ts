import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import {
  OpenAiCompatibleControllerSupport,
  type ResponseWriter,
} from '../openai-compatible/openai-compatible-controller-support';
import { McpService } from './mcp.service';

@Controller()
export class McpController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly mcpService: McpService,
  ) {
    super(httpCaptureService, 'mcp');
  }

  @Get('.well-known/mcp.json')
  async getManifest(@Req() request: ProtocolRequest) {
    const payload = this.mcpService.getManifest();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Post('mcp')
  async rpc(@Body() body: Record<string, unknown>, @Req() request: ProtocolRequest) {
    const payload = this.mcpService.handleRpc(body);
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('sse')
  async sse(@Req() request: ProtocolRequest, @Res() response: ResponseWriter): Promise<void> {
    const payload = this.mcpService.getSseEntries();
    await this.streamSse(response, payload);
    await this.capture(request, payload, 'static');
  }

  @Post('messages')
  async messages(@Body() body: Record<string, unknown>, @Req() request: ProtocolRequest) {
    const payload = this.mcpService.handleMessage(body);
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('.well-known/agent.json')
  async getAgentManifest(@Req() request: ProtocolRequest) {
    const payload = this.mcpService.getAgentManifest();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('.well-known/ai-plugin.json')
  async getPluginManifest(@Req() request: ProtocolRequest) {
    const payload = this.mcpService.getAiPluginManifest();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('openapi.json')
  async openapi(@Req() request: ProtocolRequest) {
    const payload = this.mcpService.getOpenApiDocument();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('swagger.json')
  async swagger(@Req() request: ProtocolRequest) {
    const payload = this.mcpService.getOpenApiDocument();
    await this.capture(request, payload, 'static');
    return payload;
  }
}