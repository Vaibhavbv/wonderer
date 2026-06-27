import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Navbar } from "@/components/layout/navbar";
import { TripGrid } from "@/components/dashboard/trip-grid";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CreateTripButton } from "@/components/dashboard/create-trip-button";
import { getTrips, type TripSummary } from "@/lib/trip-api";

export default async function DashboardPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/");

  let trips: TripSummary[] = [];
  let total = 0;
  try {
    const token = await getToken();
    if (token) {
      const res = await getTrips(token);
      trips = res.items;
      total = res.total;
    }
  } catch {
    // API unreachable — render an empty dashboard rather than crashing the page.
  }

  const photos = trips.reduce((sum, t) => sum + (t.photosCount || 0), 0);
  const stories = trips.reduce((sum, t) => sum + (t.storyBlocksCount || 0), 0);
  const countries = new Set(
    trips.flatMap((t) => t.locations.map((l) => l.country).filter(Boolean)),
  ).size;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-text-primary">Your Trips</h1>
              <p className="text-text-secondary mt-1">Manage and create your travel stories</p>
            </div>
            <CreateTripButton />
          </div>
          <StatsCards stats={{ trips: total, photos, stories, countries }} />
          <div className="mt-10">
            <TripGrid trips={trips} />
          </div>
        </div>
      </main>
    </div>
  );
}
