"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTrip } from "@/lib/trip-api";

interface ShareButtonProps {
  tripId: string;
  privacy: "PRIVATE" | "UNLISTED" | "PUBLIC";
  viewerIsOwner: boolean;
}

export function ShareButton({ tripId, privacy, viewerIsOwner }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showPrivateHint, setShowPrivateHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentPrivacy, setCurrentPrivacy] = useState(privacy);
  const { getToken } = useAuth();
  const prefersReduced = useReducedMotion();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  }

  async function handleClick() {
    if (currentPrivacy === "PRIVATE") {
      setShowPrivateHint(true);
      return;
    }
    await copyLink();
  }

  // Owner shortcut from the "it's private" hint: flip to unlisted, then copy.
  async function makeUnlistedAndCopy() {
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) return;
      await updateTrip(token, tripId, { privacy: "UNLISTED" });
      setCurrentPrivacy("UNLISTED");
      setShowPrivateHint(false);
      await copyLink();
    } catch {
      /* leave the hint open so the user can retry */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={handleClick} aria-label="Share trip">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="copied"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-success"
            >
              <Check className="h-4 w-4" />
              Copied
            </motion.span>
          ) : (
            <motion.span
              key="share"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <Share2 className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {showPrivateHint && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-surface p-4 shadow-lg"
          >
            <p className="text-sm font-medium text-text-primary">This trip is private</p>
            <p className="mt-1 text-xs text-text-secondary">
              Only you can open a shared link right now.
            </p>
            <div className="mt-3 flex gap-2">
              {viewerIsOwner && (
                <Button size="xs" onClick={makeUnlistedAndCopy} isLoading={busy}>
                  Make unlisted &amp; copy
                </Button>
              )}
              <Button size="xs" variant="ghost" onClick={() => setShowPrivateHint(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
