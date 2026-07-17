"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRecord,
} from "@/lib/notifications-api";

export function useNotifications() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const { items, unreadCount } = await getNotifications(token);
      setItems(items);
      setUnreadCount(unreadCount);
    } catch {
      /* ignore — leave previous state */
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    refresh();

    // Keep the unread badge honest: poll on an interval and refetch when the
    // tab regains focus (skip polling in hidden tabs to save requests).
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isLoaded, isSignedIn, refresh]);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      const token = await getToken();
      if (token) await markNotificationRead(token, id);
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      const token = await getToken();
      if (token) await markAllNotificationsRead(token);
    } catch {
      /* ignore */
    }
  }

  return { items, unreadCount, loading, refresh, markRead, markAllRead };
}
