"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useVelocity, useSpring, useTransform } from "framer-motion";
import type { FeedTrip } from "@/lib/api";
import { mediaSrc } from "@/lib/utils";

const SIZES = ["w-72 h-80", "w-96 h-64", "w-64 h-96", "w-80 h-72"];

/**
 * Horizontally draggable bento strip. Drag velocity feeds a spring-damped
 * skew + scale on the track, so the whole row stretches/lags behind the
 * cursor in proportion to how fast you're flinging it — pure transform,
 * no layout writes.
 */
export function KineticShowcase({ trips }: { trips: FeedTrip[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [constraint, setConstraint] = useState(0);

  const x = useMotionValue(0);
  const velocity = useVelocity(x);
  const skewX = useSpring(useTransform(velocity, [-1500, 0, 1500], [-4, 0, 4]), { damping: 40, stiffness: 200 });
  const scaleX = useSpring(useTransform(velocity, [-1500, 0, 1500], [1.04, 1, 1.04]), { damping: 40, stiffness: 200 });

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;
      setConstraint(Math.max(0, track.scrollWidth - container.clientWidth));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [trips]);

  if (trips.length === 0) return null;

  return (
    <div ref={containerRef} className="overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <motion.div
        drag="x"
        dragConstraints={{ left: -constraint, right: 0 }}
        dragElastic={0.12}
        style={{ x }}
        className="cursor-grab active:cursor-grabbing"
      >
        <motion.div ref={trackRef} style={{ skewX, scaleX }} className="flex gap-5 pb-2 origin-left">
          {trips.map((trip, i) => {
            const cover = trip.coverPhoto ? mediaSrc(trip.coverPhoto, "medium") : null;
            const place = trip.locations[0];
            return (
              <div
                key={trip.id}
                className={`relative shrink-0 ${SIZES[i % SIZES.length]} overflow-hidden rounded-2xl bg-neutral-100`}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={trip.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary-200 to-secondary-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-heading text-lg leading-snug drop-shadow">{trip.title}</p>
                  {place && (
                    <p className="text-xs text-white/70 mt-0.5">{place.city ?? place.name}</p>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
