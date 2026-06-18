"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar, Edit, Eye, Play, Image, Share2, MoreVertical, Trash2, Copy, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface TripDetailProps {
  tripId: string;
}

const mockTrip = {
  id: "trip_1",
  title: "Kyoto Cherry Blossom Season",
  description: "A week exploring temples, gardens, and hidden alleys during sakura season. From the iconic torii gates of Fushimi Inari to the serene bamboo groves of Arashiyama, every moment was a brushstroke on a living canvas.",
  startDate: "2025-04-01",
  endDate: "2025-04-07",
  privacy: "PUBLIC" as const,
  status: "PUBLISHED" as const,
  photosCount: 147,
  videosCount: 12,
  locations: [
    { name: "Fushimi Inari", latitude: 35.0116, longitude: 135.7681 },
    { name: "Kinkaku-ji", latitude: 35.0394, longitude: 135.7292 },
    { name: "Arashiyama", latitude: 35.0094, longitude: 135.6668 },
  ],
  coverPhotoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop",
  tags: ["japan", "cherry-blossom", "temples", "photography"],
};

export function TripDetail({ tripId }: TripDetailProps) {
  const [trip] = useState(mockTrip);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Cover */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden aspect-[21/9] mb-8"
      >
        <img
          src={trip.coverPhotoUrl}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            {trip.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {trip.title}
          </h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm sm:text-base">
            {trip.description}
          </p>
        </div>
      </motion.div>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {trip.locations.length} locations
          </span>
          <span className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            {trip.photosCount} photos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/trips/${tripId}/wander`}>
            <Button variant="primary" className="group">
              <Play className="w-4 h-4 mr-2" />
              Wander View
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Map Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-surface border border-border rounded-2xl overflow-hidden mb-8"
      >
        <div className="aspect-[16/7] bg-secondary-100 relative flex items-center justify-center">
          <div className="text-center text-text-tertiary">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p>Interactive Map Component</p>
            <p className="text-sm">Mapbox GL integration with route lines and photo markers</p>
          </div>
        </div>
      </motion.div>

      {/* Photo Grid Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">Photos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary-100">
              <img
                src={`https://images.unsplash.com/photo-${[
                  "1493976040374-85c8e12f0c0e",
                  "1528360983277-13d401cdc186",
                  "1524413842407-16c525364b9b",
                  "1545569341-9eb8b387679e",
                  "1503899031524-8795357c2487",
                  "1478438299287-3d6f5f8171e3",
                  "1528164344705-6ef9c194d2e3",
                  "1548013146-7247976b2c1a",
                ][i]}?w=400&h=400&fit=crop`}
                alt="Trip photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
