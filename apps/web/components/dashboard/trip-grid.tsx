"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Lock, Globe, Eye, MoreVertical, Trash2, Copy, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

// Mock data for demo
const mockTrips = [
  {
    id: "trip_1",
    title: "Kyoto Cherry Blossom Season",
    slug: "kyoto-cherry-blossom-2025",
    description: "A week exploring temples, gardens, and hidden alleys during sakura season.",
    startDate: "2025-04-01",
    endDate: "2025-04-07",
    privacy: "PUBLIC" as const,
    status: "PUBLISHED" as const,
    photosCount: 147,
    locations: [{ name: "Kyoto, Japan" }],
    coverPhotoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop",
  },
  {
    id: "trip_2",
    title: "Iceland Ring Road Adventure",
    slug: "iceland-ring-road",
    description: "10 days driving the entire ring road, chasing waterfalls and northern lights.",
    startDate: "2024-11-15",
    endDate: "2024-11-25",
    privacy: "PRIVATE" as const,
    status: "DRAFT" as const,
    photosCount: 312,
    locations: [{ name: "Reykjavik, Iceland" }],
    coverPhotoUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop",
  },
  {
    id: "trip_3",
    title: "Patagonia Trekking",
    slug: "patagonia-trekking",
    description: "Torres del Paine and El Chalten — the trek of a lifetime.",
    startDate: "2024-03-10",
    endDate: "2024-03-20",
    privacy: "UNLISTED" as const,
    status: "PUBLISHED" as const,
    photosCount: 89,
    locations: [{ name: "Patagonia, Chile/Argentina" }],
    coverPhotoUrl: "https://images.unsplash.com/photo-1518182170546-0766ce6fec56?w=800&h=600&fit=crop",
  },
];

export function TripGrid() {
  const [trips] = useState(mockTrips);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip, index) => (
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Link href={`/trips/${trip.id}`}>
            <Card className="overflow-hidden group cursor-pointer p-0">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={trip.coverPhotoUrl}
                  alt={trip.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trip.privacy === "PUBLIC"
                      ? "bg-green-500/80 text-white"
                      : trip.privacy === "UNLISTED"
                      ? "bg-yellow-500/80 text-white"
                      : "bg-gray-500/80 text-white"
                  }`}>
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
                <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {trip.locations[0]?.name}
                </p>
                <div className="flex items-center justify-between mt-3 text-sm text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(trip.startDate)}
                  </span>
                  <span>{trip.photosCount} photos</span>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
