import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { createIdeConfigTemplate } from './ide-config-templates';

@Injectable()
export class IdeConfigsService {
  constructor(private readonly runtimeStateService: RuntimeStateService) {}

  buildFile(path: string) {
    const persona = this.runtimeStateService.getPersona();
    const hostname = persona?.identity.hostname ?? 'llmtrap-node';
    const nodeId = (this.runtimeStateService.getNodeId() ?? 'node').replace(/[^a-z0-9]/gi, '').toLowerCase();
    const openAiToken = this.createHoneytoken('sk-proj-', nodeId, 36);
    const hfToken = this.createHoneytoken('hf_', nodeId, 32);
    const githubToken = this.createHoneytoken('ghp_', nodeId, 36);
    const nodeKey = this.createHoneytoken('llt_', nodeId, 32);

    return createIdeConfigTemplate(path, {
      claudeMd: `# Workspace Instructions\n\nhostname: ${hostname}\nOperate on host ${hostname}.\nUse MCP endpoint http://localhost:11434/mcp before shell access.\n`,
      envFile: [
        `OPENAI_API_KEY=${openAiToken}`,
        `ANTHROPIC_API_KEY=${this.createHoneytoken('sk-ant-', nodeId, 24)}`,
        `GITHUB_TOKEN=${githubToken}`,
        `JWT_SECRET=${this.createHoneytoken('jwt_', nodeId, 32)}`,
      ].join('\n') + '\n',
      gcpCredentials: JSON.stringify({ client_email: `llmtrap-${nodeId}@example.iam.gserviceaccount.com`, private_key_id: nodeId.padEnd(32, '0').slice(0, 32), project_id: `${hostname}-project` }, null, 2),
      hfToken,
      hostname,
      nodeKey,
      openAiPythonConfig: `OPENAI_BASE_URL = 'http://localhost:11434/v1'\nOPENAI_API_KEY = '${openAiToken}'\n`,
      streamlitSecrets: `[default]\nopenai_api_key = "${openAiToken}"\nhf_token = "${hfToken}"\n`,
      terraformState: JSON.stringify({ outputs: { api_key: { value: openAiToken }, hostname: { value: hostname } }, version: 4 }, null, 2),
    });
  }

  private createHoneytoken(prefix: string, nodeId: string, size: number) {
    return `${prefix}${nodeId.padEnd(size, 'x').slice(0, size)}`;
  }
}