"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar, Edit, Play, BookOpen, Image as ImageIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/trips/like-button";
import { ShareButton } from "@/components/trips/share-button";
import { CommentThread } from "@/components/trips/comment-thread";
import { formatDate, mediaSrc } from "@/lib/utils";
import type { TripRecord } from "@/lib/trip-api";

export function TripDetail({ trip, viewerIsOwner = false }: { trip: TripRecord; viewerIsOwner?: boolean }) {
  const images = trip.media.filter((m) => m.type === "IMAGE");
  const cover = trip.coverPhoto ? mediaSrc(trip.coverPhoto) : images[0] ? mediaSrc(images[0]) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Cover */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden aspect-[21/9] mb-8 bg-secondary-100"
      >
        {cover ? (
          <img src={cover} alt={trip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-300 to-secondary-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          {trip.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {trip.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {trip.title}
          </h1>
          {trip.description && (
            <p className="mt-2 text-white/80 max-w-2xl text-sm sm:text-base">{trip.description}</p>
          )}
        </div>
      </motion.div>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
          {trip.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(trip.startDate)}
              {trip.endDate && ` — ${formatDate(trip.endDate)}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {trip.locations.length} {trip.locations.length === 1 ? "location" : "locations"}
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            {images.length} photos
          </span>
          <a href="#comments" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
            <MessageCircle className="w-4 h-4" />
            {trip.commentsCount} {trip.commentsCount === 1 ? "comment" : "comments"}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/trips/${trip.id}/wander`}>
            <Button variant="primary" className="group">
              <Play className="w-4 h-4 mr-2" />
              Wander View
            </Button>
          </Link>
          <LikeButton tripId={trip.id} initialLiked={trip.isLiked} initialCount={trip.likesCount} />
          <Link href={`/trips/${trip.id}/journal`}>
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Journal
            </Button>
          </Link>
          {viewerIsOwner && (
            <Link href={`/trips/${trip.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <ShareButton tripId={trip.id} privacy={trip.privacy} viewerIsOwner={viewerIsOwner} />
        </div>
      </motion.div>

      {/* Destinations */}
      {trip.locations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">Destinations</h2>
          <div className="space-y-3">
            {trip.locations.map((loc) => (
              <div key={loc.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-text-primary font-medium">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  {loc.name}
                  {loc.country && <span className="text-text-tertiary font-normal">· {loc.country}</span>}
                </div>
                {loc.notes && <p className="text-sm text-text-secondary mt-2">{loc.notes}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Photo Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">Photos</h2>
        {images.length === 0 ? (
          <p className="text-text-tertiary text-sm">No photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((m) => (
              <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-secondary-100">
                <img
                  src={mediaSrc(m, "medium")}
                  alt={m.caption || "Trip photo"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Comments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8"
      >
        <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">Comments</h2>
        <CommentThread tripId={trip.id} tripOwnerId={trip.userId} />
      </motion.div>
    </div>
  );
}
