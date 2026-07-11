import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComment, likeComment, getComments } from './comments-api';
import { ApiError } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('comments-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('createComment posts content and parentId and returns the created comment', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { id: 'c1' } }));

    const result = await createComment('token', 'trip-1', { content: 'hi', parentId: 'c0' });

    expect(result).toEqual({ id: 'c1' });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ content: 'hi', parentId: 'c0' }));
  });

  it('likeComment throws ApiError with the server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, error: { message: 'Already liked' } }, 409),
    );

    await expect(likeComment('token', 'comment-1')).rejects.toThrow(ApiError);
    await expect(likeComment('token', 'comment-1')).rejects.toThrow('Already liked');
  });

  it('getComments returns items and nextCursor from meta', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: [{ id: 'c1' }], meta: { nextCursor: 'c1' } }),
    );

    const result = await getComments('token', 'trip-1');

    expect(result).toEqual({ items: [{ id: 'c1' }], nextCursor: 'c1' });
  });
});
