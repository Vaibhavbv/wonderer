"use client";

import Link from "next/link";
import { Compass, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-heading text-3xl text-text-primary">The trail went cold</h1>
        <p className="mt-3 text-text-secondary">
          Something broke along the way. It&apos;s us, not you — try again, or head back to familiar ground.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Link href="/">
            <Button variant="ghost">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
