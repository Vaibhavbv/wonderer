import { auth } from "@clerk/nextjs/server";
import { MarketingHome } from "@/components/home/marketing-home";
import { PersonalHome } from "@/components/home/personal-home";
import { getTrips, type TripSummary } from "@/lib/trip-api";
import { getFeed } from "@/lib/social-api";
import { getMyProfile, type MeProfile } from "@/lib/users-api";
import type { FeedTrip, Paginated } from "@/lib/api";

export default async function HomePage() {
  // Mirror middleware.ts: without CLERK_SECRET_KEY clerkMiddleware() never
  // runs, and calling auth() would throw — the public site must still boot.
  if (!process.env.CLERK_SECRET_KEY) {
    return <MarketingHome />;
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    return <MarketingHome />;
  }

  const token = await getToken();
  if (!token) {
    return <MarketingHome />;
  }

  // Each fetch degrades independently — a broken feed shouldn't blank the
  // greeting, and vice versa.
  const [me, tripsRes, feed] = await Promise.all([
    getMyProfile(token).catch((): MeProfile | null => null),
    getTrips(token).catch((): { items: TripSummary[]; total: number } => ({ items: [], total: 0 })),
    getFeed(token).catch((): Paginated<FeedTrip> | null => null),
  ]);

  return <PersonalHome me={me} trips={tripsRes.items} tripsTotal={tripsRes.total} feed={feed} />;
}
