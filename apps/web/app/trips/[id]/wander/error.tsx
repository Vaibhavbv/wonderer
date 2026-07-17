"use client";

import Link from "next/link";

// Segment boundary so a WebGL/renderer crash in the journey scene degrades to
// a recoverable screen instead of blowing away the whole app shell.
export default function WanderError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-black text-center text-white">
      <h1 className="font-heading text-3xl">The journey hit turbulence</h1>
      <p className="max-w-md text-white/60">
        The 3D experience couldn&apos;t start — this can happen on devices without WebGL support.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/40"
        >
          Back to trips
        </Link>
      </div>
    </div>
  );
}
