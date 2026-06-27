import type { Destination, Vehicle } from "./journey-data";
import type { TripRecord, TripLocationRecord, TripMediaRecord } from "./trip-api";

const FALLBACK_THEME = { from: "#1a1a2e", to: "#0a0a14", accent: "#c9b8ff", particle: "stars" as const };
const FALLBACK_VEHICLE: Vehicle = "plane";

function mediaUrl(media: TripMediaRecord): string {
  return media.variants?.large?.url || media.variants?.medium?.url || media.originalUrl;
}

function locationToDestination(loc: TripLocationRecord, media: TripMediaRecord[]): Destination {
  const cover = media.find((m) => m.locationId === loc.id && m.type === "IMAGE");

  return {
    id: loc.id,
    name: loc.name,
    country: loc.country ?? undefined,
    image: cover ? mediaUrl(cover) : undefined,
    mood: loc.notes?.trim() || "A place that became part of the story.",
    memories: media.filter((m) => m.locationId === loc.id).length,
    vehicle: FALLBACK_VEHICLE,
    theme: loc.theme ?? FALLBACK_THEME,
  };
}

// Maps a real trip's locations + media into the Destination[] shape the
// cinematic journey experience renders — the same shape the homepage demo
// uses, so the component doesn't need to know whether data is real or static.
export function tripToDestinations(trip: TripRecord): Destination[] {
  return [...trip.locations]
    .sort((a, b) => a.order - b.order)
    .map((loc) => locationToDestination(loc, trip.media));
}
