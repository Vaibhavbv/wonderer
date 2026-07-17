"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Heart, Eye } from "lucide-react";
import type { FeedTrip } from "@/lib/api";
import { mediaSrc } from "@/lib/utils";
import { TripCard } from "@/components/profile/trip-card";
import { TiltCard } from "@/components/ui/tilt-card";
import { TextReveal } from "@/components/ui/text-reveal";

/**
 * Grid of trip cards that expand in-place into a full-screen detail panel.
 * The clicked card and the overlay share a layoutId, so Framer Motion
 * animates the card's measured box straight into the overlay's box instead
 * of cross-fading two unrelated elements.
 */
export function DiscoverGallery({ trips }: { trips: FeedTrip[] }) {
  const [selected, setSelected] = useState<FeedTrip | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <motion.div
            key={trip.id}
            layoutId={`trip-card-${trip.id}`}
            className="cursor-pointer"
            onClick={() => setSelected(trip)}
          >
            <TiltCard>
              <TripCard trip={trip} />
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={`trip-card-${selected.id}`}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-2xl"
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-pressed">
                {selected.coverPhoto && (
                  <img
                    src={mediaSrc(selected.coverPhoto)}
                    alt={selected.title}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="font-heading text-3xl sm:text-5xl text-white drop-shadow-lg">
                    <TextReveal text={selected.title} delay={0.15} />
                  </h2>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {selected.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-text-secondary leading-relaxed"
                  >
                    {selected.description}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-tertiary"
                >
                  {selected.locations.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {selected.locations.map((l) => l.city ?? l.name).join(" · ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    {selected.likesCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {selected.viewsCount.toLocaleString()}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-8 flex flex-wrap items-center gap-3"
                >
                  <Link
                    href={`/trips/${selected.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]"
                  >
                    View this journey
                  </Link>
                  <Link
                    href={`/profiles/${selected.user.username}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary-500/50 hover:text-text-primary"
                  >
                    View {selected.user.displayName ?? "traveler"}&apos;s profile
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
