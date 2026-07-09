"use client";

import { useMe } from "@/lib/use-me";

// Resolves the signed-in user's own username (or null if unset / not signed in).
export function useMyUsername(): string | null {
  return useMe()?.username ?? null;
}
