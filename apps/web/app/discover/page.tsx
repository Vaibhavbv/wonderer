import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DiscoverGallery } from "@/components/discover/discover-gallery";
import { KineticShowcase } from "@/components/discover/kinetic-showcase";
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
            <div className="rounded-2xl border border-dashed border-border px-8 py-20 text-center">
              <h2 className="font-heading text-2xl text-text-primary">The world is waiting for its first story</h2>
              <p className="mx-auto mt-2 max-w-md text-text-secondary">
                No public journeys yet. Publish one of yours and it will headline this page.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="mb-4 font-heading text-xl text-text-primary">Trending journeys</h2>
                <KineticShowcase trips={trips.slice(0, 8)} />
              </div>
              <DiscoverGallery trips={trips} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
