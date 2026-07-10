import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { journey } from "@/lib/journey-data";

export const metadata: Metadata = {
  title: "Destinations — Wanderverse",
  description: "Every stop on the journey, from Delhi to the Alps.",
};

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-10 max-w-2xl">
            <h1 className="font-heading text-4xl sm:text-5xl text-text-primary">Destinations</h1>
            <p className="mt-3 text-lg text-text-secondary">
              Every stop on the journey, from Delhi to the Alps.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {journey.map((dest) => (
              <Link
                key={dest.id}
                href={`/destinations/${dest.id}`}
                className="group block rounded-2xl border border-border overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="relative h-40 w-full overflow-hidden"
                  style={!dest.image ? { background: `linear-gradient(160deg, ${dest.theme.from}, ${dest.theme.to})` } : undefined}
                >
                  {dest.image && (
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-white font-heading text-2xl drop-shadow">
                    {dest.name}
                  </span>
                </div>
                <div className="p-4">
                  {dest.country && <p className="text-xs uppercase tracking-wide text-text-tertiary">{dest.country}</p>}
                  <p className="mt-1 text-sm italic text-text-secondary">&ldquo;{dest.mood}&rdquo;</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
