import { useQuery } from '@tanstack/react-query';

import { apiClient, type ThreatIntelFilters } from '../lib/api-client';

export function useThreatBlocklist(filters: ThreatIntelFilters = {}) {
  return useQuery({
    queryFn: () => apiClient.getThreatBlocklist(filters),
    queryKey: ['threat-intel', 'blocklist', filters],
  });
}

export function useThreatIocFeed(filters: ThreatIntelFilters = {}) {
  return useQuery({
    queryFn: () => apiClient.getThreatIocFeed(filters),
    queryKey: ['threat-intel', 'ioc', filters],
  });
}

export function useThreatMitre(filters: ThreatIntelFilters = {}) {
  return useQuery({
    queryFn: () => apiClient.getThreatMitre(filters),
    queryKey: ['threat-intel', 'mitre', filters],
  });
}

export function useThreatStix(filters: ThreatIntelFilters = {}) {
  return useQuery({
    queryFn: () => apiClient.getThreatStix(filters),
    queryKey: ['threat-intel', 'stix', filters],
  });
}