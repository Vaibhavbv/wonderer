import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripCard } from "@/components/profile/trip-card";
import { FollowButton } from "@/components/profile/follow-button";
import { getProfile, getProfileTrips, ApiError } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await getProfile(username);
    const name = profile.displayName || `@${profile.username}`;
    return {
      title: `${name} — Wanderverse`,
      description: profile.bio || `${name}'s travel life on Wanderverse.`,
    };
  } catch {
    return { title: "Profile — Wanderverse" };
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let profile;
  try {
    profile = await getProfile(username);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const { items: trips } = await getProfileTrips(username).catch(() => ({ items: [] }));

  const initials = (profile.displayName || profile.username || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="flex flex-col sm:flex-row sm:items-center gap-6 mb-12">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || profile.username || "Profile photo"}
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-heading">
                {initials}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl text-text-primary">
                  {profile.displayName || `@${profile.username}`}
                </h1>
                <FollowButton username={username} />
              </div>
              {profile.username && (
                <p className="text-text-tertiary text-sm mt-0.5">@{profile.username}</p>
              )}
              {profile.bio && <p className="mt-2 text-text-secondary max-w-xl">{profile.bio}</p>}
              {profile.location && (
                <p className="mt-1 text-sm text-text-tertiary">{profile.location}</p>
              )}

              <div className="flex gap-6 mt-4 text-sm">
                <span><strong className="text-text-primary">{profile.stats.tripsCount}</strong> <span className="text-text-secondary">trips</span></span>
                <span><strong className="text-text-primary">{profile.stats.followersCount}</strong> <span className="text-text-secondary">followers</span></span>
                <span><strong className="text-text-primary">{profile.stats.followingCount}</strong> <span className="text-text-secondary">following</span></span>
                <span><strong className="text-text-primary">{profile.stats.totalLikes}</strong> <span className="text-text-secondary">likes</span></span>
              </div>
            </div>
          </header>

          {trips.length === 0 ? (
            <p className="text-text-secondary">No public trips yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
