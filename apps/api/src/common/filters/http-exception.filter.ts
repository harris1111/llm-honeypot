import type { ApiError } from '@llmtrap/shared';
import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

type RequestWithId = {
  requestId?: string;
};

type ResponseWithJson = {
  json(body: unknown): void;
  status(code: number): ResponseWithJson;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<ResponseWithJson>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = this.formatError(exception);

    response.status(status).json({
      data: null,
      error,
      meta: {
        requestId: request.requestId,
      },
    });
  }

  private formatError(exception: unknown): ApiError {
    if (!(exception instanceof HttpException)) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return {
        code: this.toCode(exception.name),
        message: response,
      };
    }

    if (typeof response === 'object' && response !== null) {
      const body = response as Record<string, unknown>;
      const rawMessage = body.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.map((value) => String(value)).join(', ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : exception.message;

      return {
        code: typeof body.code === 'string' ? body.code : this.toCode(exception.name),
        details: typeof body.details === 'object' && body.details !== null ? (body.details as Record<string, unknown>) : undefined,
        message,
      };
    }

    return {
      code: this.toCode(exception.name),
      message: exception.message,
    };
  }

  private toCode(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  }
}