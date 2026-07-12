"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AtSign, X } from "lucide-react";
import { useMe } from "@/lib/use-me";

const DISMISS_KEY = "wv-username-nudge-dismissed";

// Onboarding nudge: shown until the user claims a username. Dismissible per
// device, but returns on the next session — a profile without a handle has
// no public home.
export function ClaimUsernameBanner() {
  const me = useMe();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!me || me.username || dismissed) return null;

  return (
    <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-primary-500/30 bg-primary-500/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
          <AtSign className="h-4.5 w-4.5" />
        </span>
        <p className="text-sm text-text-primary">
          <Link href="/settings/profile" className="font-medium text-primary-400 underline-offset-2 hover:underline">
            Claim your @username
          </Link>{" "}
          — it gives your profile and trips a shareable home.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="shrink-0 rounded p-1 text-text-tertiary hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
