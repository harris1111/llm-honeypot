import type { AuthenticatedUser } from '@llmtrap/shared';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

type RequestWithUser = {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});