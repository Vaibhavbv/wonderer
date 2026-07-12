"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/use-notifications";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { NotificationRecord } from "@/lib/notifications-api";

function notificationHref(n: NotificationRecord): string | null {
  const tripId = n.data?.tripId;
  return tripId ? `/trips/${tripId}` : null;
}

export function NotificationBell({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { isSignedIn } = useUser();
  const { items, unreadCount, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!isSignedIn) return null;

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          variant === "dark"
            ? "text-white/80 hover:text-white hover:bg-white/10"
            : "text-text-secondary hover:text-primary-400 hover:bg-surface-pressed",
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface-elevated shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-tertiary">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((n) => {
                const href = notificationHref(n);
                const content = (
                  <div className={cn("px-4 py-3 border-b border-border last:border-0", !n.read && "bg-primary-500/10")}>
                    <p className="text-sm text-text-primary">{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-text-tertiary mt-1">{formatRelativeDate(n.createdAt)}</p>
                  </div>
                );
                return (
                  <li key={n.id} onClick={() => !n.read && markRead(n.id)}>
                    {href ? (
                      <Link href={href} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
