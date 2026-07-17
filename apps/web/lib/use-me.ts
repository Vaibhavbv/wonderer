"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMe, type Me } from "@/lib/api";

// One /users/me round-trip per page load instead of one per component:
// navbar, banner, and comment threads all resolve the same viewer. Short TTL
// keeps it fresh across username claims without a global invalidation dance.
const TTL_MS = 60_000;
let cached: { promise: Promise<Me>; at: number } | null = null;

export function getMeCached(token: string): Promise<Me> {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    const promise = getMe(token);
    cached = { promise, at: now };
    // A failed resolution must not poison the cache for a whole minute.
    promise.catch(() => {
      if (cached?.promise === promise) cached = null;
    });
  }
  return cached.promise;
}

export function invalidateMeCache(): void {
  cached = null;
}

// Resolves the signed-in user's own DB record (id + username).
// Returns null while loading, signed out, or on error.
export function useMe(): Me | null {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const result = await getMeCached(token);
        if (active) setMe(result);
      } catch {
        /* ignore — leave unresolved */
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return me;
}
