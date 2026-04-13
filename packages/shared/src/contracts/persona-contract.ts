import { z } from 'zod';

export const modelDescriptorSchema = z.object({
  family: z.string().min(1),
  name: z.string().min(1),
  parameterSize: z.string().min(1),
  sizeGb: z.number().positive(),
});

export const personaIdentitySchema = z.object({
  hostname: z.string().min(1),
  kernel: z.string().min(1),
  os: z.string().min(1),
  sshBanner: z.string().min(1),
  username: z.string().min(1),
});

export const personaHardwareSchema = z.object({
  cpu: z.string().min(1),
  diskGb: z.number().positive(),
  gpu: z.string().min(1),
  ramGb: z.number().positive(),
  vramGb: z.number().nonnegative(),
});

export const personaTimingSchema = z.object({
  gpuUtilizationPct: z.tuple([z.number().nonnegative(), z.number().nonnegative()]),
  loadAverage: z.tuple([z.number().nonnegative(), z.number().nonnegative(), z.number().nonnegative()]),
  uptimeDays: z.tuple([z.number().nonnegative(), z.number().nonnegative()]),
});

export const personaDefinitionSchema = z.object({
  configFiles: z.record(z.string(), z.boolean()),
  credentials: z.record(z.string(), z.string()),
  hardware: personaHardwareSchema,
  identity: personaIdentitySchema,
  models: z.array(modelDescriptorSchema).min(1),
  name: z.string().min(1),
  preset: z.string().nullable(),
  services: z.record(z.string(), z.boolean()),
  timing: personaTimingSchema,
});

export type ModelDescriptorContract = z.infer<typeof modelDescriptorSchema>;

export type PersonaDefinitionContract = z.infer<typeof personaDefinitionSchema>;