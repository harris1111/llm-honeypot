import type { NodeRuntimeConfig } from '../../config/node-runtime-config';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';
import type { ProtocolHttpServiceDefinition } from '../protocol-server.types';

type SnapshotFactory = () => ProtocolPersonaSnapshot;

function buildHtml(title: string, subtitle: string): string {
  return `<!doctype html><html><body><h1>${title}</h1><p>${subtitle}</p></body></html>`;
}

export function buildHomelabServiceDefinitions(
  config: NodeRuntimeConfig,
  snapshotFactory: SnapshotFactory,
): ProtocolHttpServiceDefinition[] {
  return [
    {
      port: config.homelabPorts.plex,
      routes: [
        { handle: () => ({ body: buildHtml('Plex', `Streaming node ${snapshotFactory().hostname}`), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { MediaContainer: { friendlyName: snapshotFactory().hostname, machineIdentifier: `${snapshotFactory().nodeId}-plex`, version: '1.40.0.7998' } } }), method: 'GET', path: '/identity' },
      ],
      service: 'plex',
    },
    {
      port: config.homelabPorts.sonarr,
      routes: [
        { handle: () => ({ body: buildHtml('Sonarr', 'Series automation ready'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { appName: 'Sonarr', branch: 'main', version: '4.0.5.1710' } }), method: 'GET', path: '/api/v3/system/status' },
      ],
      service: 'sonarr',
    },
    {
      port: config.homelabPorts.radarr,
      routes: [
        { handle: () => ({ body: buildHtml('Radarr', 'Movie automation ready'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { appName: 'Radarr', branch: 'master', version: '5.4.6.8723' } }), method: 'GET', path: '/api/v3/system/status' },
      ],
      service: 'radarr',
    },
    {
      port: config.homelabPorts.prowlarr,
      routes: [
        { handle: () => ({ body: buildHtml('Prowlarr', 'Indexer manager online'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { appName: 'Prowlarr', branch: 'develop', version: '1.18.0.4435' } }), method: 'GET', path: '/api/v1/system/status' },
      ],
      service: 'prowlarr',
    },
    {
      port: config.homelabPorts.portainer,
      routes: [
        { handle: () => ({ body: buildHtml('Portainer', 'Edge stack control plane'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { InstanceID: snapshotFactory().nodeId, Status: 'ready', Version: '2.21.0' } }), method: 'GET', path: '/api/status' },
      ],
      service: 'portainer',
    },
    {
      port: config.homelabPorts['home-assistant'],
      routes: [
        { handle: () => ({ body: buildHtml('Home Assistant', `Supervisor for ${snapshotFactory().hostname}`), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { location_name: snapshotFactory().hostname, message: 'API running.', version: '2026.4.1' } }), method: 'GET', path: '/api/' },
      ],
      service: 'home-assistant',
    },
    {
      port: config.homelabPorts.gitea,
      routes: [
        { handle: () => ({ body: buildHtml('Gitea', 'Internal forge'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { version: '1.22.0', website: 'https://gitea.io' } }), method: 'GET', path: '/api/v1/version' },
      ],
      service: 'gitea',
    },
    {
      port: config.homelabPorts.grafana,
      routes: [
        { handle: () => ({ body: buildHtml('Grafana', 'Observability stack'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { commit: 'llmtrap', database: 'ok', version: '11.0.0' } }), method: 'GET', path: '/api/health' },
      ],
      service: 'grafana',
    },
    {
      port: config.homelabPorts.prometheus,
      routes: [
        { handle: () => ({ body: buildHtml('Prometheus', 'Metrics server'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { data: { buildDate: '2026-04-13T00:00:00Z', revision: snapshotFactory().nodeId, version: '2.52.0' }, status: 'success' } }), method: 'GET', path: '/api/v1/status/buildinfo' },
      ],
      service: 'prometheus',
    },
    {
      port: config.homelabPorts['uptime-kuma'],
      routes: [
        { handle: () => ({ body: buildHtml('Uptime Kuma', 'Heartbeat status pages'), headers: { 'content-type': 'text/html; charset=utf-8' } }), method: 'GET', path: '/' },
        { handle: () => ({ body: { heartbeatList: [{ monitorID: 1, ping: 27, status: 1 }] } }), method: 'GET', path: '/api/status-page/heartbeat' },
      ],
      service: 'uptime-kuma',
    },
  ];
}