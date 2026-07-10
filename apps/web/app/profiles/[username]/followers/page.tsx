import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { UserList } from "@/components/profile/user-list";
import { getFollowers } from "@/lib/social-api";
import { ApiError } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}'s followers — Wanderverse` };
}

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let followers;
  try {
    followers = await getFollowers(username);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`/profiles/${username}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            @{username}
          </Link>
          <h1 className="mb-8 font-heading text-3xl text-text-primary">Followers</h1>
          <UserList users={followers} emptyMessage="No followers yet — great stories fix that." />
        </div>
      </main>
      <Footer />
    </div>
  );
}
