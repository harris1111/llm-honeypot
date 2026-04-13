export const mitreMappings = [
  { classification: 'scanner', tactic: 'Reconnaissance', techniqueId: 'T1595', techniqueName: 'Active Scanning' },
  { classification: 'config_hunter', tactic: 'Discovery', techniqueId: 'T1083', techniqueName: 'File and Directory Discovery' },
  { classification: 'validator', tactic: 'Discovery', techniqueId: 'T1046', techniqueName: 'Network Service Discovery' },
  { classification: 'attacker', tactic: 'Credential Access', techniqueId: 'T1552.001', techniqueName: 'Credentials in Files' },
  { classification: 'free_rider', tactic: 'Impact', techniqueId: 'T1496', techniqueName: 'Resource Hijacking' },
] as const;