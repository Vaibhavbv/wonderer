"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMe, type Me } from "@/lib/api";

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
        const result = await getMe(token);
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
