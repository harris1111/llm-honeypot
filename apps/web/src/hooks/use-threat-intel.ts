import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useThreatBlocklist() {
  return useQuery({
    queryFn: apiClient.getThreatBlocklist,
    queryKey: ['threat-intel', 'blocklist'],
  });
}

export function useThreatIocFeed() {
  return useQuery({
    queryFn: apiClient.getThreatIocFeed,
    queryKey: ['threat-intel', 'ioc'],
  });
}

export function useThreatMitre() {
  return useQuery({
    queryFn: apiClient.getThreatMitre,
    queryKey: ['threat-intel', 'mitre'],
  });
}

export function useThreatStix() {
  return useQuery({
    queryFn: apiClient.getThreatStix,
    queryKey: ['threat-intel', 'stix'],
  });
}