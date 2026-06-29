"use client";

import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Plane } from "lucide-react";

const links = [
  { label: "Discover", href: "/discover" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
];

export function JourneyNav({ accent }: { accent: string }) {
  const { isSignedIn } = useUser();
  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 flex items-center justify-between rounded-full border border-white/15 bg-black/20 px-5 py-2.5 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-700"
              style={{ background: accent }}
            >
              <Plane className="h-4 w-4 text-black" />
            </span>
            <span className="font-heading text-lg text-white">Wanderverse</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/80 hover:text-white">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="rounded-full border border-white/25 px-4 py-1.5 text-sm text-white transition-colors hover:bg-white/10">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
