export default function TripLoading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="aspect-[16/7] animate-pulse rounded-2xl bg-surface-pressed motion-reduce:animate-none" />
        <div className="mt-8 space-y-4">
          <div className="h-9 w-2/3 animate-pulse rounded-xl bg-surface-pressed motion-reduce:animate-none" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-pressed motion-reduce:animate-none" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-pressed motion-reduce:animate-none" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-surface-pressed motion-reduce:animate-none" />
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface-pressed motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
