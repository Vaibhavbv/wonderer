"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MapPin, Calendar, Lock, Globe, Eye, Pencil, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/tilt-card";
import { formatDate, mediaSrc } from "@/lib/utils";
import Link from "next/link";
import { updateTrip, type TripSummary } from "@/lib/trip-api";

function coverUrl(t: TripSummary): string | null {
  if (!t.coverPhoto) return null;
  return mediaSrc(t.coverPhoto, "medium");
}

// The whole card is wrapped in a Link, so in-card actions must be buttons
// (nested anchors are invalid HTML) that stop the navigation event.
function EditShortcut({ tripId, title }: { tripId: string; title: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/trips/${tripId}/edit`);
      }}
      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated/90 text-text-secondary opacity-0 backdrop-blur-sm transition-opacity hover:text-primary-400 group-hover:opacity-100 focus:opacity-100"
      aria-label={`Edit ${title}`}
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}

// Publish-from-the-card quick action for drafts.
function PublishBadge({ tripId }: { tripId: string }) {
  const [busy, setBusy] = useState(false);
  const { getToken } = useAuth();
  const router = useRouter();

  async function publish(e: React.MouseEvent) {
    // Card is wrapped in a Link — don't navigate.
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) return;
      await updateTrip(token, tripId, { status: "PUBLISHED" });
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={publish}
      disabled={busy}
      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning backdrop-blur-sm transition-colors hover:bg-primary-500 hover:text-white disabled:opacity-60"
      title="Publish this trip"
    >
      <Upload className="w-3 h-3 inline mr-1" />
      {busy ? "Publishing…" : "DRAFT — publish"}
    </button>
  );
}

export function TripGrid({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-2xl py-20 text-center">
        <MapPin className="w-8 h-8 mx-auto mb-3 text-text-tertiary" />
        <p className="font-heading text-xl text-text-primary">Every atlas starts blank</p>
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
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-pressed">
                  {cover ? (
                    <img
                      src={cover}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-pressed bg-gradient-to-br from-primary-500/25 to-primary-900/40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge
                      variant={
                        trip.privacy === "PUBLIC" ? "success" : trip.privacy === "UNLISTED" ? "warning" : "neutral"
                      }
                      className="backdrop-blur-sm"
                    >
                      {trip.privacy === "PUBLIC" ? (
                        <Globe className="w-3 h-3" />
                      ) : trip.privacy === "UNLISTED" ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {trip.privacy}
                    </Badge>
                    {trip.status === "DRAFT" && <PublishBadge tripId={trip.id} />}
                  </div>
                  <EditShortcut tripId={trip.id} title={trip.title} />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-text-primary group-hover:text-primary-400 transition-colors">
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
