export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3">
          <div className="h-12 w-64 animate-pulse rounded-xl bg-surface-pressed motion-reduce:animate-none" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-surface-pressed motion-reduce:animate-none" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 motion-reduce:animate-none">
              <div className="aspect-[4/3] rounded-2xl bg-surface-pressed" />
              <div className="h-4 w-2/3 rounded bg-surface-pressed" />
              <div className="h-3 w-1/3 rounded bg-surface-pressed" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
