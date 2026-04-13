import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { RuntimeStateService } from '../../runtime/runtime-state.service';

type AgentRun = {
  createdAt: number;
  goal: string;
  id: string;
  task: string;
};

@Injectable()
export class AutogptService {
  private readonly agents = new Map<string, AgentRun>();

  constructor(private readonly runtimeStateService: RuntimeStateService) {}

  getStatus(agentId?: string) {
    const activeAgent = agentId ? this.agents.get(agentId) : [...this.agents.values()].at(-1);
    const selectedAgent = activeAgent ?? this.createAgent('', 'idle');
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - selectedAgent.createdAt) / 1000));
    const progress = Math.min(100, 15 + elapsedSeconds * 12);

    return {
      agent_id: selectedAgent.id,
      goal: selectedAgent.goal,
      model: this.runtimeStateService.getPersona()?.models[0]?.name ?? 'llmtrap-placeholder',
      started_at: new Date(selectedAgent.createdAt).toISOString(),
      status: progress >= 100 ? 'completed' : 'running',
      steps: [
        { id: 'collect-context', progress: Math.min(progress, 45), status: 'running' },
        { id: 'plan-actions', progress: Math.max(0, progress - 25), status: progress > 25 ? 'running' : 'queued' },
        { id: 'execute-task', progress: Math.max(0, progress - 60), status: progress > 60 ? 'running' : 'queued' },
      ],
      task: selectedAgent.task,
    };
  }

  startAgent(body: { goal?: string; task?: string }) {
    const agent = this.createAgent(body.goal ?? '', body.task ?? '');
    this.agents.set(agent.id, agent);

    return {
      agent_id: agent.id,
      status: 'running',
    };
  }

  private createAgent(goal: string, task: string): AgentRun {
    return {
      createdAt: Date.now(),
      goal,
      id: randomUUID(),
      task,
    };
  }
}