import Link from "next/link";
import { FollowButton } from "@/components/profile/follow-button";
import type { PublicUser } from "@/lib/api";

export function UserList({ users, emptyMessage }: { users: PublicUser[]; emptyMessage: string }) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="font-heading text-xl text-text-primary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {users.map((user) => {
        const initials = (user.displayName || user.username || "?")
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <li key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <Link
              href={user.username ? `/profiles/${user.username}` : "#"}
              className="group flex min-w-0 items-center gap-3"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500/15 font-heading text-sm text-primary-400">
                  {initials}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-heading text-lg text-text-primary group-hover:text-primary-600">
                  {user.displayName || `@${user.username}`}
                </span>
                {user.username && (
                  <span className="block truncate text-sm text-text-tertiary">@{user.username}</span>
                )}
              </span>
            </Link>
            {user.username && <FollowButton username={user.username} />}
          </li>
        );
      })}
    </ul>
  );
}
