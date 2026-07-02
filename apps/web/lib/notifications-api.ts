import { ApiError } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const message = json?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return json.data as T;
}

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
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status);
  }
  return {
    items: (json.data as NotificationRecord[]) ?? [],
    nextCursor: json.meta?.nextCursor ?? null,
    unreadCount: json.meta?.unreadCount ?? 0,
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
