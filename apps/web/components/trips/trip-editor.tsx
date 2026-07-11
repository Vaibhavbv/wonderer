"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Globe2,
  ImagePlus,
  MapPin,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaSrc } from "@/lib/utils";
import { uploadTripPhotos } from "@/lib/upload";
import {
  addLocation,
  deleteLocation,
  deleteMedia,
  deleteTrip,
  getTrip,
  reorderLocations,
  updateLocation,
  updateTrip,
  type TripLocationRecord,
  type TripMediaRecord,
  type TripRecord,
} from "@/lib/trip-api";

const PRIVACY_OPTIONS = [
  { value: "PRIVATE", label: "Private", hint: "Only you (and collaborators) can see it" },
  { value: "UNLISTED", label: "Unlisted", hint: "Anyone with the link can see it" },
  { value: "PUBLIC", label: "Public", hint: "Shows on Discover and your profile" },
] as const;

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500";

function Card({ title, subtitle, children, delay = 0 }: { title: string; subtitle?: string; children: React.ReactNode; delay?: number }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.section
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="font-heading text-xl text-text-primary">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

interface LocationDraft {
  name: string;
  country: string;
  city: string;
  notes: string;
  latitude: string;
  longitude: string;
}

function toDraft(loc: TripLocationRecord): LocationDraft {
  return {
    name: loc.name,
    country: loc.country ?? "",
    city: loc.city ?? "",
    notes: loc.notes ?? "",
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
  };
}

const emptyLocationDraft: LocationDraft = { name: "", country: "", city: "", notes: "", latitude: "", longitude: "" };

export function TripEditor({ trip: initialTrip }: { trip: TripRecord }) {
  const router = useRouter();
  const { getToken } = useAuth();

  // Details form
  const [title, setTitle] = useState(initialTrip.title);
  const [description, setDescription] = useState(initialTrip.description ?? "");
  const [startDate, setStartDate] = useState(initialTrip.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(initialTrip.endDate?.slice(0, 10) ?? "");
  const [tags, setTags] = useState<string[]>(initialTrip.tags);
  const [tagInput, setTagInput] = useState("");
  const [privacy, setPrivacy] = useState(initialTrip.privacy);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Publish
  const [status, setStatus] = useState(initialTrip.status);
  const [publishing, setPublishing] = useState(false);

  // Media
  const [media, setMedia] = useState<TripMediaRecord[]>(initialTrip.media);
  const [coverPhotoId, setCoverPhotoId] = useState(initialTrip.coverPhoto?.id ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Locations
  const [locations, setLocations] = useState<TripLocationRecord[]>(initialTrip.locations);
  const [drafts, setDrafts] = useState<Record<string, LocationDraft>>(() =>
    Object.fromEntries(initialTrip.locations.map((l) => [l.id, toDraft(l)])),
  );
  const [savingLocationId, setSavingLocationId] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState<LocationDraft>(emptyLocationDraft);
  const [addingLocation, setAddingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Danger zone
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T | null> {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      return await fn(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    }
  }

  // ---- Details ----

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function saveDetails() {
    setSavingDetails(true);
    const result = await withToken((token) =>
      updateTrip(token, initialTrip.id, {
        title: title.trim() || initialTrip.title,
        description,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        tags,
        privacy,
      }),
    );
    setSavingDetails(false);
    if (result) {
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2000);
      router.refresh();
    }
  }

  // ---- Publish ----

  async function togglePublish() {
    const next = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setPublishing(true);
    const result = await withToken((token) => updateTrip(token, initialTrip.id, { status: next }));
    setPublishing(false);
    if (result) {
      setStatus(next);
      router.refresh();
    }
  }

  // ---- Media ----

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    await withToken(async (token) => {
      const { uploadedIds, failedCount } = await uploadTripPhotos(token, initialTrip.id, Array.from(files));
      if (failedCount > 0) setError(`${failedCount} photo(s) failed to upload`);
      if (uploadedIds.length > 0) {
        // Refetch: the new media rows (with their public URLs) only exist
        // server-side after the presign+PUT pipeline.
        const fresh = await getTrip(token, initialTrip.id);
        setMedia(fresh.media);
        router.refresh();
      }
      return true;
    });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removePhoto(mediaId: string) {
    const result = await withToken((token) => deleteMedia(token, mediaId).then(() => true));
    if (result) {
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      if (coverPhotoId === mediaId) setCoverPhotoId(null);
    }
  }

  async function setCover(mediaId: string) {
    const result = await withToken((token) => updateTrip(token, initialTrip.id, { coverPhotoId: mediaId }));
    if (result) setCoverPhotoId(mediaId);
  }

  // ---- Locations ----

  function updateDraft(id: string, patch: Partial<LocationDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function parseCoords(draft: LocationDraft): { latitude: number; longitude: number } | null {
    const lat = Number(draft.latitude);
    const lng = Number(draft.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { latitude: lat, longitude: lng };
  }

  async function saveLocation(loc: TripLocationRecord) {
    const draft = drafts[loc.id];
    if (!draft?.name.trim()) {
      setError("A location needs a name");
      return;
    }
    const coords = parseCoords(draft);
    if (!coords) {
      setError("Latitude must be −90…90 and longitude −180…180");
      return;
    }
    setSavingLocationId(loc.id);
    const result = await withToken((token) =>
      updateLocation(token, initialTrip.id, loc.id, {
        name: draft.name.trim(),
        country: draft.country.trim() || undefined,
        city: draft.city.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        ...coords,
      }),
    );
    setSavingLocationId(null);
    if (result) {
      setLocations((prev) => prev.map((l) => (l.id === loc.id ? result : l)));
      setDrafts((prev) => ({ ...prev, [loc.id]: toDraft(result) }));
    }
  }

  async function removeLocation(loc: TripLocationRecord) {
    if (!window.confirm(`Remove "${loc.name}" from this trip? Its photos stay in the trip.`)) return;
    const result = await withToken((token) => deleteLocation(token, initialTrip.id, loc.id).then(() => true));
    if (result) {
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
    }
  }

  async function move(loc: TripLocationRecord, dir: -1 | 1) {
    const idx = locations.findIndex((l) => l.id === loc.id);
    const target = idx + dir;
    if (target < 0 || target >= locations.length) return;
    const next = [...locations];
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocations(next); // optimistic
    const result = await withToken((token) =>
      reorderLocations(token, initialTrip.id, next.map((l) => l.id)),
    );
    if (result) setLocations(result);
    else setLocations(locations); // revert
  }

  async function handleAddLocation() {
    if (!newLocation.name.trim()) {
      setError("Give the new stop a name");
      return;
    }
    const coords = parseCoords(newLocation);
    if (!coords) {
      setError("Coordinates are required for new stops — they place the pin on your globe");
      return;
    }
    setAddingLocation(true);
    const result = await withToken((token) =>
      addLocation(token, initialTrip.id, {
        name: newLocation.name.trim(),
        country: newLocation.country.trim() || undefined,
        city: newLocation.city.trim() || undefined,
        notes: newLocation.notes.trim() || undefined,
        ...coords,
      }),
    );
    setAddingLocation(false);
    if (result) {
      setLocations((prev) => [...prev, result]);
      setDrafts((prev) => ({ ...prev, [result.id]: toDraft(result) }));
      setNewLocation(emptyLocationDraft);
      setShowAddForm(false);
    }
  }

  // ---- Danger ----

  async function handleDeleteTrip() {
    setDeleting(true);
    const result = await withToken((token) => deleteTrip(token, initialTrip.id).then(() => true));
    if (result) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
    }
  }

  const images = media.filter((m) => m.type === "IMAGE");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <p className="text-sm uppercase tracking-widest text-primary-600">Edit trip</p>
          <h1 className="mt-1 font-heading text-3xl text-text-primary">{title || initialTrip.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/trips/${initialTrip.id}/journal`}>
            <Button variant="outline" size="sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Journal
            </Button>
          </Link>
          <Link href={`/trips/${initialTrip.id}/wander`}>
            <Button variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Wander View
            </Button>
          </Link>
          <Link href={`/trips/${initialTrip.id}`}>
            <Button variant="ghost" size="sm">Done</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {/* Details */}
      <Card title="Details" subtitle="Title, dates, tags and who can see this trip.">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="What was this journey about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Tags</label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                  {tag}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="Add tag…"
                className="min-w-28 flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Visibility</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {PRIVACY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrivacy(opt.value)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    privacy === opt.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-border bg-surface hover:border-primary-200"
                  }`}
                >
                  <span className="block text-sm font-medium text-text-primary">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-text-tertiary">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveDetails} isLoading={savingDetails}>
              {detailsSaved ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved
                </>
              ) : (
                "Save details"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Publish */}
      <Card
        title="Publish"
        subtitle="Published trips appear on your public profile — and on Discover when the trip is public."
        delay={0.05}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "PUBLISHED" ? "bg-success/10 text-success" : "bg-accent-100 text-accent-700"
            }`}
          >
            {status === "PUBLISHED" ? "Published" : status === "ARCHIVED" ? "Archived" : "Draft"}
          </span>
          <Button
            variant={status === "PUBLISHED" ? "outline" : "primary"}
            onClick={togglePublish}
            isLoading={publishing}
          >
            {status === "PUBLISHED" ? "Unpublish" : "Publish trip"}
          </Button>
        </div>
      </Card>

      {/* Photos */}
      <Card title="Photos" subtitle="Add memories, remove the misfires, and pick your cover." delay={0.1}>
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Add photos
          </Button>
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-text-tertiary">No photos yet — this trip deserves some.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((m) => (
              <div
                key={m.id}
                className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${
                  coverPhotoId === m.id ? "border-primary-500" : "border-transparent"
                }`}
              >
                <img src={mediaSrc(m, "medium")} alt={m.caption || "Trip photo"} className="h-full w-full object-cover" />
                {coverPhotoId === m.id && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {coverPhotoId !== m.id ? (
                    <button
                      type="button"
                      onClick={() => setCover(m.id)}
                      className="rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-800 hover:bg-white"
                    >
                      Set cover
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(m.id)}
                    className="rounded bg-white/90 p-1 text-error hover:bg-white"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Locations */}
      <Card
        title="Itinerary"
        subtitle="Each stop is a pin on your journey globe — coordinates place it in the world."
        delay={0.15}
      >
        <div className="space-y-4">
          {locations.map((loc, idx) => {
            const draft = drafts[loc.id] ?? toDraft(loc);
            return (
              <div key={loc.id} className="rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    Stop {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(loc, -1)}
                      disabled={idx === 0}
                      className="rounded p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(loc, 1)}
                      disabled={idx === locations.length - 1}
                      className="rounded p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLocation(loc)}
                      className="ml-1 rounded p-1 text-text-tertiary hover:text-error"
                      aria-label="Remove stop"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft(loc.id, { name: e.target.value })}
                    placeholder="Place name"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={draft.country}
                    onChange={(e) => updateDraft(loc.id, { country: e.target.value })}
                    placeholder="Country"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="any"
                    value={draft.latitude}
                    onChange={(e) => updateDraft(loc.id, { latitude: e.target.value })}
                    placeholder="Latitude (−90…90)"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="any"
                    value={draft.longitude}
                    onChange={(e) => updateDraft(loc.id, { longitude: e.target.value })}
                    placeholder="Longitude (−180…180)"
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={draft.notes}
                  onChange={(e) => updateDraft(loc.id, { notes: e.target.value })}
                  placeholder="The memory you want to keep from here…"
                  rows={2}
                  className={`mt-3 ${inputClass}`}
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => saveLocation(loc)} isLoading={savingLocationId === loc.id}>
                    Save stop
                  </Button>
                </div>
              </div>
            );
          })}

          {showAddForm ? (
            <div className="rounded-xl border-2 border-dashed border-primary-200 p-4">
              <p className="mb-3 text-sm font-medium text-text-primary">New stop</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={newLocation.name} onChange={(e) => setNewLocation((p) => ({ ...p, name: e.target.value }))} placeholder="Place name" className={inputClass} />
                <input type="text" value={newLocation.country} onChange={(e) => setNewLocation((p) => ({ ...p, country: e.target.value }))} placeholder="Country" className={inputClass} />
                <input type="number" step="any" value={newLocation.latitude} onChange={(e) => setNewLocation((p) => ({ ...p, latitude: e.target.value }))} placeholder="Latitude (−90…90)" className={inputClass} />
                <input type="number" step="any" value={newLocation.longitude} onChange={(e) => setNewLocation((p) => ({ ...p, longitude: e.target.value }))} placeholder="Longitude (−180…180)" className={inputClass} />
              </div>
              <textarea
                value={newLocation.notes}
                onChange={(e) => setNewLocation((p) => ({ ...p, notes: e.target.value }))}
                placeholder="The memory you want to keep from here…"
                rows={2}
                className={`mt-3 ${inputClass}`}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddLocation} isLoading={addingLocation}>
                  Add stop
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <Plus className="h-4 w-4" />
              Add a stop
            </button>
          )}

          {locations.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <Globe2 className="h-3.5 w-3.5" />
              Changed coordinates?{" "}
              <Link href={`/trips/${initialTrip.id}/wander`} className="text-primary-600 hover:underline">
                View on globe
              </Link>
            </p>
          )}
        </div>
      </Card>

      {/* Danger zone */}
      <Card title="Danger zone" delay={0.2}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            Deleting a trip removes its locations, photos, story and comments. There is no undo.
          </p>
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Keep trip
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteTrip} isLoading={deleting}>
                Yes, delete forever
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete trip
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
