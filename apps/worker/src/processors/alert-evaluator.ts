export interface AlertCandidate {
  actorId?: string | null;
  classification?: string | null;
  nodeId: string;
  paths: string[];
  requestCount: number;
  service: string;
  sourceIp: string;
}

interface AlertRuleCondition {
  field: keyof AlertCandidate;
  operator?: 'contains' | 'eq' | 'exists' | 'gte' | 'in' | 'lte' | 'matches' | 'neq';
  value?: unknown;
}

function matchRule(value: unknown, rule: AlertRuleCondition): boolean {
  switch (rule.operator ?? 'eq') {
    case 'contains':
      return Array.isArray(value) ? value.includes(rule.value) : String(value ?? '').includes(String(rule.value ?? ''));
    case 'exists':
      return rule.value ? value !== null && value !== undefined : value === null || value === undefined;
    case 'gte':
      return Number(value ?? 0) >= Number(rule.value ?? 0);
    case 'in':
      return Array.isArray(rule.value) ? rule.value.includes(value) : false;
    case 'lte':
      return Number(value ?? 0) <= Number(rule.value ?? 0);
    case 'matches':
      return new RegExp(String(rule.value ?? ''), 'i').test(String(value ?? ''));
    case 'neq':
      return value !== rule.value;
    case 'eq':
    default:
      return value === rule.value;
  }
}

export function matchesAlertConditions(conditions: Record<string, unknown>, candidate: AlertCandidate): boolean {
  const ruleList = Array.isArray(conditions.rules) ? (conditions.rules as AlertRuleCondition[]) : [];
  if (ruleList.length > 0) {
    return ruleList.every((rule) => matchRule(candidate[rule.field], rule));
  }

  if (conditions.classification && !matchRule(candidate.classification, { field: 'classification', operator: 'in', value: [].concat(conditions.classification as never) })) {
    return false;
  }

  if (conditions.service && !matchRule(candidate.service, { field: 'service', operator: 'in', value: [].concat(conditions.service as never) })) {
    return false;
  }

  if (conditions.minRequestCount && !matchRule(candidate.requestCount, { field: 'requestCount', operator: 'gte', value: conditions.minRequestCount })) {
    return false;
  }

  if (conditions.sourceIp && !matchRule(candidate.sourceIp, { field: 'sourceIp', operator: 'eq', value: conditions.sourceIp })) {
    return false;
  }

  if (conditions.pathIncludes) {
    const patterns = Array.isArray(conditions.pathIncludes) ? conditions.pathIncludes : [conditions.pathIncludes];
    return patterns.some((pattern) => candidate.paths.some((path) => path.includes(String(pattern))));
  }

  return Object.keys(conditions).length > 0;
}