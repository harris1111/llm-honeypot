import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

const cloudProviders = ['AWS', 'Azure', 'GCP', 'Hetzner', 'OVH'];
const countries = ['United States', 'Germany', 'Singapore', 'Japan', 'Netherlands'];

function isPrivateIp(ip: string): boolean {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

function pick<T>(input: string, values: readonly T[]): T {
  const hash = createHash('sha256').update(input).digest()[0] ?? 0;
  return values[hash % values.length];
}

export function buildSyntheticIpEnrichment(ip: string, now = new Date()) {
  const publicIp = isIP(ip) !== 0 && !isPrivateIp(ip);
  const cloudProvider = publicIp ? pick(ip, cloudProviders) : null;
  const abuseSeed = createHash('md5').update(ip).digest()[0] ?? 0;
  const abuseScore = publicIp ? Math.min(95, abuseSeed) : 0;

  return {
    abuseScore,
    asn: publicIp ? `AS${40_000 + abuseSeed}` : 'AS0',
    city: publicIp ? `Metro ${String(abuseSeed % 50).padStart(2, '0')}` : 'Private Segment',
    cloudProvider,
    country: publicIp ? pick(ip, countries) : 'Private Network',
    enrichedAt: now,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000),
    isKnownBad: abuseScore >= 75,
    isTor: publicIp && abuseSeed % 17 === 0,
    isVpn: publicIp && abuseSeed % 11 === 0,
    isp: publicIp ? `${cloudProvider ?? 'Transit'} Edge` : 'Internal',
    ispType: publicIp ? 'hosting' : 'private',
    org: publicIp ? `${cloudProvider ?? 'Research'} Network` : 'Internal',
    region: publicIp ? 'Synthetic Region' : 'RFC1918',
    reverseDns: publicIp ? `scan-${abuseSeed}.example.invalid` : 'internal.local',
  };
}