import type { Metadata } from "next";
import { MapJourney } from "@/components/journey/map-journey";

export const metadata: Metadata = {
  title: "Your journey — Wanderverse",
  description:
    "Fly across a living 3D map — every destination, one cinematic journey.",
};

export default function JourneyPage() {
  return <MapJourney />;
}
