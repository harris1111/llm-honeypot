export interface ActorCandidateSignal {
  headerFingerprint?: string | null;
  tlsFingerprints: string[];
  userAgents: string[];
}

export interface SessionActorSignal {
  headerFingerprint?: string | null;
  paths: string[];
  tlsFingerprint?: string | null;
  userAgent?: string | null;
}

function normalizePath(path: string): string {
  return path.replace(/\?.*$/, '').replace(/\/+/g, '/').toLowerCase();
}

function behaviorOverlap(paths: string[], otherPaths: string[]): boolean {
  const left = new Set(paths.map((path) => normalizePath(path)));
  return otherPaths.some((path) => left.has(normalizePath(path)));
}

export function scoreActorMatch(signal: SessionActorSignal, actor: ActorCandidateSignal & { paths: string[] }): number {
  let score = 0;

  if (signal.headerFingerprint && actor.headerFingerprint === signal.headerFingerprint) {
    score += 40;
  }

  if (signal.tlsFingerprint && actor.tlsFingerprints.includes(signal.tlsFingerprint)) {
    score += 20;
  }

  if (signal.userAgent && actor.userAgents.includes(signal.userAgent)) {
    score += 20;
  }

  if (behaviorOverlap(signal.paths, actor.paths)) {
    score += 20;
  }

  return score;
}