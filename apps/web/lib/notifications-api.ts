import { API_URL, authHeaders, unwrap, unwrapWithMeta } from "./api";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: { tripId?: string; userId?: string; commentId?: string } | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export async function getNotifications(
  token: string,
  cursor?: string,
): Promise<{ items: NotificationRecord[]; nextCursor: string | null; unreadCount: number }> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_URL}/v1/notifications${params}`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  const { data, meta } = await unwrapWithMeta<
    NotificationRecord[],
    { nextCursor?: string | null; unreadCount?: number }
  >(res);
  return {
    items: data ?? [],
    nextCursor: meta?.nextCursor ?? null,
    unreadCount: meta?.unreadCount ?? 0,
  };
}

export async function markNotificationRead(token: string, id: string): Promise<NotificationRecord> {
  const res = await fetch(`${API_URL}/v1/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<NotificationRecord>(res);
}

export async function markAllNotificationsRead(token: string): Promise<{ updated: boolean }> {
  const res = await fetch(`${API_URL}/v1/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ updated: boolean }>(res);
}
