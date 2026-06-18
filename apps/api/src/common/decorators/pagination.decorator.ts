import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const cursor = request.query.cursor;
    const perPage = Math.min(parseInt(request.query.per_page || '20', 10), 100);
    const sort = request.query.sort || 'created_at:desc';

    return { cursor, perPage, sort };
  },
);
