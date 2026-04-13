import { z } from 'zod';

export const userRoleSchema = z.enum(['ADMIN', 'ANALYST', 'VIEWER']);

export const authenticatedUserSchema = z.object({
  email: z.string().email(),
  id: z.string().min(1),
  role: userRoleSchema,
  totpEnabled: z.boolean(),
});

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyTotpRequestSchema = z.object({
  code: z.string().trim().length(6),
  tempToken: z.string().min(1),
});

export const setupTotpResponseSchema = z.object({
  manualEntryKey: z.string().min(1),
  otpauthUrl: z.string().url(),
});

export const enableTotpRequestSchema = z.object({
  code: z.string().trim().length(6),
});

export const refreshSessionRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const loginSuccessSchema = z.object({
  requiresTotp: z.literal(false),
  tokens: tokenPairSchema,
  user: authenticatedUserSchema,
});

export const loginTotpChallengeSchema = z.object({
  requiresTotp: z.literal(true),
  tempToken: z.string().min(1),
});

export const loginResponseSchema = z.union([loginSuccessSchema, loginTotpChallengeSchema]);

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type EnableTotpRequest = z.infer<typeof enableTotpRequestSchema>;

export type RefreshSessionRequest = z.infer<typeof refreshSessionRequestSchema>;

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export type SetupTotpResponse = z.infer<typeof setupTotpResponseSchema>;

export type TokenPair = z.infer<typeof tokenPairSchema>;

export type VerifyTotpRequest = z.infer<typeof verifyTotpRequestSchema>;