import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Calendar, Clock, Heart, CloudSun, Sparkles, PenLine } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { journey, getDestination } from "@/lib/journey-data";

export function generateStaticParams() {
  return journey.map((dest) => ({ id: dest.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dest = getDestination(id);
  if (!dest) return { title: "Destination — Wanderverse" };
  return {
    title: `${dest.name} — Wanderverse`,
    description: dest.mood,
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dest = getDestination(id);
  if (!dest) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20">
        <div
          className="relative h-[50vh] w-full overflow-hidden"
          style={!dest.image ? { background: `linear-gradient(160deg, ${dest.theme.from}, ${dest.theme.to})` } : undefined}
        >
          {dest.image && <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto w-full">
            {dest.country && (
              <p className="text-white/70 text-sm tracking-[0.3em] uppercase mb-2">{dest.country}</p>
            )}
            <h1 className="font-heading text-white text-5xl sm:text-6xl drop-shadow-2xl">{dest.name}</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <p className="text-xl italic text-text-secondary">&ldquo;{dest.mood}&rdquo;</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
            {dest.date && (
              <div>
                <Calendar className="h-4 w-4 text-text-tertiary mb-1" />
                <p className="text-sm text-text-primary">{dest.date}</p>
              </div>
            )}
            {dest.days !== undefined && (
              <div>
                <Clock className="h-4 w-4 text-text-tertiary mb-1" />
                <p className="text-sm text-text-primary">{dest.days} days</p>
              </div>
            )}
            <div>
              <Heart className="h-4 w-4 text-text-tertiary mb-1" />
              <p className="text-sm text-text-primary">{dest.memories} memories</p>
            </div>
            {dest.weather && (
              <div>
                <CloudSun className="h-4 w-4 text-text-tertiary mb-1" />
                <p className="text-sm text-text-primary">{dest.weather}</p>
              </div>
            )}
          </div>

          {dest.favorite && (
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-primary-500/10 p-5">
              <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: dest.theme.accent }} />
              <p className="text-text-secondary">{dest.favorite}</p>
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
            <p className="text-xs uppercase tracking-widest text-primary-400">Demo journey</p>
            <h2 className="mt-2 font-heading text-2xl text-text-primary">
              Your {dest.name} could look like this
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
              This stop is part of our demo journey. Map your own travels and every place you&apos;ve
              been gets the same cinematic treatment.
            </p>
            <div className="mt-5">
              <SignedIn>
                <Link href="/dashboard">
                  <Button>
                    <PenLine className="mr-2 h-4 w-4" />
                    Create a trip like this
                  </Button>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button>
                    <PenLine className="mr-2 h-4 w-4" />
                    Start your own journey
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
