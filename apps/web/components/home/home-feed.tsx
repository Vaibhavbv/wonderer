"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Compass, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/profile/trip-card";
import { getFeed } from "@/lib/social-api";
import type { FeedTrip } from "@/lib/api";

interface HomeFeedProps {
  initialItems: FeedTrip[];
  initialCursor: string | null;
  /** True when the viewer follows nobody yet. */
  followsNobody: boolean;
}

export function HomeFeed({ initialItems, initialCursor, followsNobody }: HomeFeedProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const prefersReduced = useReducedMotion();

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const page = await getFeed(token, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      /* keep what we have; the button stays for retry */
    } finally {
      setLoading(false);
    }
  }

  if (followsNobody || items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-8 py-16 text-center">
        <h3 className="font-heading text-2xl text-text-primary">
          Your world is quiet — for now
        </h3>
        <p className="mx-auto mt-2 max-w-md text-text-secondary">
          {followsNobody
            ? "Follow a few travelers and their journeys will land here."
            : "The travelers you follow haven't published a trip yet."}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/discover">
            <Button>
              <Compass className="mr-2 h-4 w-4" />
              Discover travelers
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">
              <PenLine className="mr-2 h-4 w-4" />
              Write your own
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((trip, index) => (
          <motion.div
            key={trip.id}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(index % 6, 5) * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col gap-2">
              <Link href={`/trips/${trip.id}`} className="block">
                <TripCard trip={trip} />
              </Link>
              {trip.user.username && (
                <Link
                  href={`/profiles/${trip.user.username}`}
                  className="flex items-center gap-2 px-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
                >
                  {trip.user.avatarUrl ? (
                    <img
                      src={trip.user.avatarUrl}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/15 text-[10px] text-primary-400">
                      {(trip.user.displayName || trip.user.username || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                  {trip.user.displayName || `@${trip.user.username}`}
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {cursor && (
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={loadMore} isLoading={loading}>
            Load more journeys
          </Button>
        </div>
      )}
    </div>
  );
}
