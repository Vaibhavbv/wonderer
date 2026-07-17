export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-surface-pressed motion-reduce:animate-none" />
          <div className="space-y-3">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-pressed motion-reduce:animate-none" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface-pressed motion-reduce:animate-none" />
            <div className="h-4 w-56 animate-pulse rounded bg-surface-pressed motion-reduce:animate-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 motion-reduce:animate-none">
              <div className="aspect-[4/3] rounded-2xl bg-surface-pressed" />
              <div className="h-4 w-2/3 rounded bg-surface-pressed" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
