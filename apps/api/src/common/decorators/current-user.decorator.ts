import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  email?: string;
  orgId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
