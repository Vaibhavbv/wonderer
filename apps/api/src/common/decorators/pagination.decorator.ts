import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

// Reads pagination straight off request.query, so it never passes through the
// global ValidationPipe — every value must be treated as hostile here.
export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const rawCursor = request.query.cursor;
    const cursor = typeof rawCursor === 'string' && rawCursor.length > 0 ? rawCursor : undefined;

    const parsed = parseInt(request.query.per_page, 10);
    const perPage = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), MAX_PER_PAGE)
      : DEFAULT_PER_PAGE;

    const rawSort = request.query.sort;
    const sort = typeof rawSort === 'string' && rawSort.length > 0 ? rawSort : 'created_at:desc';

    return { cursor, perPage, sort };
  },
);
