import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CreateTripButton } from "@/components/dashboard/create-trip-button";
import { ClaimUsernameBanner } from "@/components/profile/claim-username-banner";
import { HomeFeed } from "@/components/home/home-feed";
import type { TripSummary } from "@/lib/trip-api";
import type { FeedTrip, Paginated } from "@/lib/api";
import type { MeProfile } from "@/lib/users-api";

interface PersonalHomeProps {
  me: MeProfile | null;
  trips: TripSummary[];
  tripsTotal: number;
  feed: Paginated<FeedTrip> | null;
}

// Signed-in homepage: the user's travel world — greeting, their stats, the
// draft they left off on, and a feed from the travelers they follow.
export function PersonalHome({ me, trips, tripsTotal, feed }: PersonalHomeProps) {
  const firstName = me?.displayName?.split(" ")[0] || null;
  const photos = trips.reduce((sum, t) => sum + (t.photosCount || 0), 0);
  const stories = trips.reduce((sum, t) => sum + (t.storyBlocksCount || 0), 0);
  const countries = new Set(
    trips.flatMap((t) => t.locations.map((l) => l.country).filter(Boolean)),
  ).size;

  const latestDraft = trips.find((t) => t.status === "DRAFT") ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ClaimUsernameBanner />
          {/* Greeting */}
          <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary-600">Your travel world</p>
              <h1 className="mt-2 font-heading text-4xl text-text-primary sm:text-5xl">
                Welcome back{firstName ? `, ${firstName}` : ", traveler"}
              </h1>
              <p className="mt-2 text-text-secondary">
                {tripsTotal > 0
                  ? `${tripsTotal} ${tripsTotal === 1 ? "journey" : "journeys"} mapped across ${countries} ${countries === 1 ? "country" : "countries"}.`
                  : "Your map is waiting for its first journey."}
              </p>
            </div>
            <CreateTripButton />
          </header>

          {/* Continue where you left off */}
          {latestDraft && (
            <Link
              href={`/trips/${latestDraft.id}/edit`}
              className="group mb-8 flex items-center justify-between rounded-2xl border border-primary-200 bg-primary-50 px-6 py-5 transition-colors hover:border-primary-400"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <PenLine className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-primary-700">Continue where you left off</p>
                  <p className="font-heading text-lg text-text-primary">{latestDraft.title}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary-600 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          <StatsCards stats={{ trips: tripsTotal, photos, stories, countries }} />

          {/* Feed */}
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl text-text-primary">From travelers you follow</h2>
                <p className="mt-1 text-sm text-text-secondary">Fresh journeys from your corner of the world.</p>
              </div>
              <Link href="/discover" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Discover more →
              </Link>
            </div>
            {feed ? (
              <HomeFeed
                initialItems={feed.items}
                initialCursor={feed.nextCursor}
                followsNobody={Boolean(feed.empty)}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-surface px-8 py-12 text-center text-text-secondary">
                We couldn&apos;t reach your feed just now — refresh to try again.
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
