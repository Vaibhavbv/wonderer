import { Compass } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 motion-safe:animate-pulse">
          <Compass className="h-7 w-7 text-white" />
        </div>
        <p className="mt-4 font-heading text-lg text-text-secondary">Charting the route…</p>
      </div>
    </div>
  );
}
