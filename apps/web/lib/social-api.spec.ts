import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFeed, getRelationship, followUser, unfollowUser, getFollowers } from './social-api';
import { ApiError } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('social-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getFeed returns items, nextCursor and the empty flag', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { items: [], nextCursor: null, empty: true } }),
    );

    const result = await getFeed('token');

    expect(result.empty).toBe(true);
    expect(result.items).toEqual([]);
  });

  it('getFeed passes the cursor as a query param', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { items: [], nextCursor: null } }),
    );

    await getFeed('token', 'trip-9');

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/v1/feed?cursor=trip-9');
  });

  it('followUser posts to the follow route and returns following state', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { following: true } }));

    const result = await followUser('token', 'aya');

    expect(result).toEqual({ following: true });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/v1/profiles/aya/follow');
    expect(init?.method).toBe('POST');
  });

  it('unfollowUser sends DELETE', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { following: false } }));

    await unfollowUser('token', 'aya');

    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('getRelationship surfaces server errors as ApiError', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, error: { message: 'Profile not found' } }, 404),
    );

    await expect(getRelationship('token', 'ghost')).rejects.toThrow(ApiError);
  });

  it('getFollowers hits the public followers route without auth headers', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: [{ id: 'u1' }] }));

    const result = await getFollowers('aya');

    expect(result).toEqual([{ id: 'u1' }]);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/v1/profiles/aya/followers');
    expect(init && 'headers' in init ? init.headers : undefined).toBeUndefined();
  });
});
