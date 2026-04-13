import type { AttackClassification } from '../types';

export const attackClassifications = [
  'free_rider',
  'scanner',
  'config_hunter',
  'attacker',
  'mcp_prober',
  'validator',
  'unknown',
] as const satisfies readonly AttackClassification[];

export const classificationLabels: Record<AttackClassification, string> = {
  attacker: 'Attacker',
  config_hunter: 'Config Hunter',
  free_rider: 'Free-Rider',
  mcp_prober: 'MCP Prober',
  scanner: 'Scanner',
  unknown: 'Unknown',
  validator: 'Validator',
};