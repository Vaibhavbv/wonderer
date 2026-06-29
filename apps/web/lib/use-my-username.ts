"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMe } from "@/lib/api";

// Resolves the signed-in user's own username (or null if unset / not signed in).
export function useMyUsername(): string | null {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        if (active) setUsername(me.username);
      } catch {
        /* ignore — leave username unresolved */
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return username;
}
