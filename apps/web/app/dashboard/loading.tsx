// Skeleton mirroring the dashboard's real geometry: header row, four stat
// cards, then the trip grid.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-8 w-48 rounded-lg bg-neutral-200 motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-neutral-100 motion-safe:animate-pulse" />
          </div>
          <div className="h-11 w-32 rounded-md bg-neutral-200 motion-safe:animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-surface motion-safe:animate-pulse" />
          ))}
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="aspect-[4/3] bg-neutral-100 motion-safe:animate-pulse" />
              <div className="space-y-2 p-5">
                <div className="h-5 w-3/4 rounded bg-neutral-200 motion-safe:animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-neutral-100 motion-safe:animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
