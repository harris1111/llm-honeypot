import { z } from 'zod';

const optionalQueryString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalPositiveInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
}, z.number().int().positive().max(500).optional());

export const threatIntelFiltersSchema = z.object({
  classification: optionalQueryString,
  days: optionalPositiveInt,
  limit: optionalPositiveInt,
  nodeId: optionalQueryString,
  service: optionalQueryString,
  sourceIp: optionalQueryString,
});

export type ThreatIntelFilters = typeof threatIntelFiltersSchema['_type'];