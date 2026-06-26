import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripCard } from "@/components/profile/trip-card";
import { getDiscover } from "@/lib/api";

export const metadata: Metadata = {
  title: "Discover — Wanderverse",
  description: "Journeys from travelers around the world, newest first.",
};

export default async function DiscoverPage() {
  const { items: trips } = await getDiscover().catch(() => ({ items: [] }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-10 max-w-2xl">
            <h1 className="font-heading text-4xl sm:text-5xl text-text-primary">Discover</h1>
            <p className="mt-3 text-lg text-text-secondary">
              Journeys from travelers around the world, newest first.
            </p>
          </header>

          {trips.length === 0 ? (
            <p className="text-text-secondary">No public trips yet — be the first to share one.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <a key={trip.id} href={`/profiles/${trip.user.username}`}>
                  <TripCard trip={trip} />
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
