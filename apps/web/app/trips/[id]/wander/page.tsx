import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { JourneyExperience } from "@/components/journey/journey-experience";
import { getTrip } from "@/lib/trip-api";
import { tripToDestinations } from "@/lib/trip-to-journey";
import { ApiError } from "@/lib/api";

export default async function WanderPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/");

  const { id } = await params;
  const token = await getToken();
  if (!token) redirect("/");

  let trip;
  try {
    trip = await getTrip(token, id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  const destinations = tripToDestinations(trip);

  if (destinations.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-black text-center text-white">
        <h1 className="font-heading text-3xl">{trip.title}</h1>
        <p className="text-white/60">Add a destination to start building this trip&apos;s story.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <JourneyExperience destinations={destinations} />
    </div>
  );
}
