type ClassificationBreakdown = { classification: string; count: number };
type NotableSession = {
  actorId: string | null;
  classification: string | null;
  id: string;
  requestCount: number;
  service: string;
  sourceIp: string;
  startedAt: string;
};
type TopActor = { id: string; label: string | null; sessions: number };

export type ReportSnapshot = {
  classificationBreakdown: ClassificationBreakdown[];
  generatedAt: string;
  notableSessions: NotableSession[];
  periodDays: number;
  summary: {
    requests: number;
    sessions: number;
    uniqueSourceIps: number;
  };
  topActors: TopActor[];
};

function escapeHtml(input: string): string {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function renderReport(snapshot: ReportSnapshot, format: 'html' | 'json' | 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(snapshot, null, 2);
  }

  if (format === 'html') {
    return `<!doctype html>
<html>
  <body style="font-family: ui-sans-serif, system-ui; background:#111827; color:#f9fafb; padding:32px; line-height:1.5;">
    <h1>LLMTrap Report</h1>
    <p>Generated ${escapeHtml(snapshot.generatedAt)} for the last ${snapshot.periodDays} day(s).</p>
    <h2>Summary</h2>
    <ul>
      <li>Sessions: ${snapshot.summary.sessions}</li>
      <li>Requests: ${snapshot.summary.requests}</li>
      <li>Unique source IPs: ${snapshot.summary.uniqueSourceIps}</li>
    </ul>
    <h2>Classification Breakdown</h2>
    <ul>${snapshot.classificationBreakdown
      .map((entry) => `<li>${escapeHtml(entry.classification)}: ${entry.count}</li>`)
      .join('')}</ul>
    <h2>Top Actors</h2>
    <ul>${snapshot.topActors
      .map((actor) => `<li>${escapeHtml(actor.label ?? actor.id)}: ${actor.sessions} session(s)</li>`)
      .join('')}</ul>
    <h2>Notable Sessions</h2>
    <ul>${snapshot.notableSessions
      .map(
        (session) =>
          `<li>${escapeHtml(session.id)} - ${escapeHtml(session.service)} - ${escapeHtml(session.sourceIp)} - ${session.requestCount} request(s)</li>`,
      )
      .join('')}</ul>
  </body>
</html>`;
  }

  return [
    '# LLMTrap Report',
    `Generated: ${snapshot.generatedAt}`,
    `Period: last ${snapshot.periodDays} day(s)`,
    '',
    '## Summary',
    `- Sessions: ${snapshot.summary.sessions}`,
    `- Requests: ${snapshot.summary.requests}`,
    `- Unique source IPs: ${snapshot.summary.uniqueSourceIps}`,
    '',
    '## Classification Breakdown',
    ...snapshot.classificationBreakdown.map((entry) => `- ${entry.classification}: ${entry.count}`),
    '',
    '## Top Actors',
    ...snapshot.topActors.map((actor) => `- ${actor.label ?? actor.id}: ${actor.sessions} session(s)`),
    '',
    '## Notable Sessions',
    ...snapshot.notableSessions.map(
      (session) => `- ${session.id}: ${session.service} from ${session.sourceIp} (${session.requestCount} requests)`,
    ),
  ].join('\n');
}

export function renderSessionExportCsv(snapshot: ReportSnapshot & { sessions: Array<NotableSession> }): string {
  const rows = [
    'session_id,service,source_ip,classification,request_count,actor_id,started_at',
    ...snapshot.sessions.map((session) =>
      [
        session.id,
        session.service,
        session.sourceIp,
        session.classification ?? '',
        String(session.requestCount),
        session.actorId ?? '',
        session.startedAt,
      ].join(','),
    ),
  ];

  return rows.join('\n');
}