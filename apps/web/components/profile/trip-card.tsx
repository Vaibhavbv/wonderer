import type { FeedTrip } from "@/lib/api";
import { mediaSrc } from "@/lib/utils";

function formatRange(start: string | null, end: string | null) {
  if (!start) return "";
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const sStr = s.toLocaleDateString("en-US", opts);
  if (!end) return sStr;
  const e = new Date(end);
  const eStr = e.toLocaleDateString("en-US", opts);
  return sStr === eStr ? sStr : `${sStr} – ${eStr}`;
}

export function TripCard({ trip }: { trip: FeedTrip }) {
  const cover = trip.coverPhoto ? mediaSrc(trip.coverPhoto, "medium") : null;
  const place = trip.locations[0];
  const placeLabel = place ? `${place.city ?? place.name}${place.country ? `, ${place.country}` : ""}` : null;

  return (
    <article className="group overflow-hidden rounded-xl bg-surface border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {cover ? (
          <img
            src={cover}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">No cover</div>
        )}
        {trip.locations.length > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 backdrop-blur">
            {trip.locations.length} {trip.locations.length === 1 ? "stop" : "stops"}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-primary-600">{formatRange(trip.startDate, trip.endDate)}</p>
        <h3 className="mt-1 font-heading text-xl leading-snug text-text-primary">{trip.title}</h3>
        {placeLabel && <p className="mt-1 text-sm text-text-secondary">{placeLabel}</p>}
        <div className="mt-3 flex items-center gap-4 text-sm text-text-tertiary">
          <span>♥ {trip.likesCount.toLocaleString()}</span>
          <span>{trip.viewsCount.toLocaleString()} views</span>
        </div>
      </div>
    </article>
  );
}
