import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { JourneyExperience } from "@/components/journey/journey-experience";
import { getTrip } from "@/lib/trip-api";
import { tripToDestinations } from "@/lib/trip-to-journey";
import { ApiError } from "@/lib/api";

// Public for PUBLIC/UNLISTED trips (same optional-auth contract as the trip
// page) — a shared link should lead straight into the cinematic experience.
export default async function WanderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);
  const session = clerkEnabled ? await auth() : null;
  const token = session?.userId ? await session.getToken() : null;

  let trip;
  try {
    trip = await getTrip(token, id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403 || err.status === 401)) {
      notFound();
    }
    throw err;
  }

  const destinations = tripToDestinations(trip);
  // (0,0) marks "not placed yet" (create flow allows blank coordinates);
  // rendering those stops would pile every pin in the Gulf of Guinea.
  const placed = destinations.filter((d) => d.coords[0] !== 0 || d.coords[1] !== 0);
  const unplacedCount = destinations.length - placed.length;

  if (placed.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-black text-center text-white">
        <h1 className="font-heading text-3xl">{trip.title}</h1>
        <p className="max-w-md text-white/60">
          {destinations.length === 0
            ? "Add a destination to start building this trip's story."
            : "Set coordinates on this trip's destinations (Edit trip) to place them on the globe."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <JourneyExperience destinations={placed} />
      {unplacedCount > 0 && (
        <p className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white/70 backdrop-blur">
          {unplacedCount} stop{unplacedCount > 1 ? "s" : ""} hidden — set coordinates in Edit trip to place them
        </p>
      )}
    </div>
  );
}
