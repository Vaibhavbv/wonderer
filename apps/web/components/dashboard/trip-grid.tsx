"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Lock, Globe, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/tilt-card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { TripSummary } from "@/lib/trip-api";

function coverUrl(t: TripSummary): string | null {
  if (!t.coverPhoto) return null;
  return (
    t.coverPhoto.variants?.medium?.url ||
    t.coverPhoto.variants?.large?.url ||
    t.coverPhoto.originalUrl ||
    null
  );
}

export function TripGrid({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-2xl py-20 text-center">
        <MapPin className="w-8 h-8 mx-auto mb-3 text-text-tertiary" />
        <p className="text-text-primary font-medium">No trips yet</p>
        <p className="text-text-tertiary text-sm mt-1">
          Click &ldquo;New Trip&rdquo; to add your destinations, photos, and memories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip, index) => {
        const cover = coverUrl(trip);
        return (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link href={`/trips/${trip.id}`}>
            <TiltCard maxTilt={6} liftScale={1.02}>
              <Card className="overflow-hidden group cursor-pointer p-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary-100">
                  {cover ? (
                    <img
                      src={cover}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-200 to-secondary-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trip.privacy === "PUBLIC"
                          ? "bg-green-500/80 text-white"
                          : trip.privacy === "UNLISTED"
                          ? "bg-yellow-500/80 text-white"
                          : "bg-gray-500/80 text-white"
                      }`}
                    >
                      {trip.privacy === "PUBLIC" ? (
                        <Globe className="w-3 h-3 inline mr-1" />
                      ) : trip.privacy === "UNLISTED" ? (
                        <Eye className="w-3 h-3 inline mr-1" />
                      ) : (
                        <Lock className="w-3 h-3 inline mr-1" />
                      )}
                      {trip.privacy}
                    </span>
                    {trip.status === "DRAFT" && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/80 text-white">
                        DRAFT
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                    {trip.title}
                  </h3>
                  {trip.locations[0]?.name && (
                    <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {trip.locations[0].name}
                      {trip.locations.length > 1 && ` +${trip.locations.length - 1} more`}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-sm text-text-tertiary">
                    {trip.startDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(trip.startDate)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span>{trip.photosCount} photos</span>
                  </div>
                </div>
              </Card>
            </TiltCard>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
