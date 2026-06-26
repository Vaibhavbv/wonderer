import type { Metadata } from "next";
import { JourneyExperience } from "@/components/journey/journey-experience";

export const metadata: Metadata = {
  title: "Your journey — Wanderverse",
  description:
    "Scroll through a cinematic journey across the world — every destination, drawn on a living map.",
};

export default function JourneyPage() {
  return <JourneyExperience />;
}
