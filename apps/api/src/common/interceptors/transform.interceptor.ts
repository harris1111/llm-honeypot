import type { ApiEnvelope } from '@llmtrap/shared';
import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { map, type Observable } from 'rxjs';

type RequestWithId = {
  requestId?: string;
};

type ResponseWithHeaders = {
  setHeader(name: string, value: string): void;
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<ResponseWithHeaders>();
    const requestId = request.requestId ?? randomUUID();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((body) => {
        if (typeof body === 'object' && body !== null && 'data' in body && 'error' in body) {
          return body as ApiEnvelope<T>;
        }

        return {
          data: body,
          error: null,
          meta: {
            requestId,
          },
        };
      }),
    );
  }
}