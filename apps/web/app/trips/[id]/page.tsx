import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripDetail } from "@/components/trips/trip-detail";
import { getTrip } from "@/lib/trip-api";
import { getMyProfile } from "@/lib/users-api";
import { ApiError } from "@/lib/api";

// PUBLIC/UNLISTED trips render for signed-out visitors too — that's what
// makes shared links work. PRIVATE trips 403 on the API and land on 404 here.
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // auth() throws when Clerk middleware isn't active (no CLERK_SECRET_KEY),
  // so only consult it when the key is configured — same guard as app/page.tsx.
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

  if (token) {
    const me = await getMyProfile(token).catch(() => null);
    const viewerIsOwner = Boolean(me && me.id === trip.userId);

    return (
      <AppSidebar>
        <div className="pt-2 sm:pt-4">
          <TripDetail trip={trip} viewerIsOwner={viewerIsOwner} />
        </div>
      </AppSidebar>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <TripDetail trip={trip} viewerIsOwner={false} />

          <div className="mt-12 rounded-2xl border border-primary-500/30 bg-primary-500/10 px-6 py-8 text-center sm:px-10">
            <h2 className="font-heading text-2xl text-text-primary">Make your own travel story</h2>
            <p className="mx-auto mt-2 max-w-md text-text-secondary">
              Turn your trips into cinematic journeys like this one — free to start.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]"
            >
              Join Wanderverse
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
