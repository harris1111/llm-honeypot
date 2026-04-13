import { z } from 'zod';

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
  message: z.string().min(1),
});

export const apiMetaSchema = z.object({
  nextCursor: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  total: z.number().int().nonnegative().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export type ApiMeta = z.infer<typeof apiMetaSchema>;

export interface ApiSuccessEnvelope<TData> {
  data: TData;
  error: null;
  meta?: ApiMeta;
}

export interface ApiErrorEnvelope {
  data: null;
  error: ApiError;
  meta?: ApiMeta;
}

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope;