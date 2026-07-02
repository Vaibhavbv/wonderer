import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from './notifications-api';
import { ApiError } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('notifications-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getNotifications returns items, nextCursor, and unreadCount from meta', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: [{ id: 'n1' }],
        meta: { nextCursor: 'n1', unreadCount: 4 },
      }),
    );

    const result = await getNotifications('token');

    expect(result).toEqual({ items: [{ id: 'n1' }], nextCursor: 'n1', unreadCount: 4 });
  });

  it('defaults unreadCount to 0 when meta is missing', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: [] }));

    const result = await getNotifications('token');

    expect(result.unreadCount).toBe(0);
  });

  it('markNotificationRead PATCHes the read endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { id: 'n1', read: true } }));

    const result = await markNotificationRead('token', 'n1');

    expect(result).toEqual({ id: 'n1', read: true });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/v1/notifications/n1/read');
    expect(init?.method).toBe('PATCH');
  });

  it('markAllNotificationsRead throws ApiError on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401));

    await expect(markAllNotificationsRead('token')).rejects.toThrow(ApiError);
  });
});
