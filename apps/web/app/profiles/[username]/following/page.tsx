import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { UserList } from "@/components/profile/user-list";
import { getFollowing } from "@/lib/social-api";
import { ApiError } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Who @${username} follows — Wanderverse` };
}

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let following;
  try {
    following = await getFollowing(username);
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
          <h1 className="mb-8 font-heading text-3xl text-text-primary">Following</h1>
          <UserList users={following} emptyMessage="Not following anyone yet — the world awaits." />
        </div>
      </main>
      <Footer />
    </div>
  );
}
