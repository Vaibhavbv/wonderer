"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTrip, getPresignedUrl, updateMedia, updateTrip, uploadToPresignedUrl } from "@/lib/trip-api";

interface DraftDestination {
  key: string;
  name: string;
  country: string;
  notes: string;
  files: File[];
}

function emptyDestination(): DraftDestination {
  return { key: Math.random().toString(36).slice(2), name: "", country: "", notes: "", files: [] };
}

export function CreateTripButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [destinations, setDestinations] = useState<DraftDestination[]>([emptyDestination()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const router = useRouter();

  function updateDestination(key: string, patch: Partial<DraftDestination>) {
    setDestinations((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function addDestination() {
    setDestinations((prev) => [...prev, emptyDestination()]);
  }

  function removeDestination(key: string) {
    setDestinations((prev) => prev.filter((d) => d.key !== key));
  }

  function close() {
    setIsOpen(false);
    setError(null);
    setTitle("");
    setDestinations([emptyDestination()]);
  }

  async function handleCreate() {
    const validDestinations = destinations.filter((d) => d.name.trim());
    if (!title.trim()) {
      setError("Give your trip a title.");
      return;
    }
    if (validDestinations.length === 0) {
      setError("Add at least one destination.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");

      const trip = await createTrip(token, {
        title: title.trim(),
        locations: validDestinations.map((d) => ({
          name: d.name.trim(),
          country: d.country.trim() || undefined,
          notes: d.notes.trim() || undefined,
          latitude: 0,
          longitude: 0,
        })),
      });

      const uploadedIds = await Promise.all(
        trip.locations.map(async (location, idx) => {
          const files = validDestinations[idx]?.files ?? [];
          const ids: string[] = [];
          for (const file of files) {
            try {
              const presigned = await getPresignedUrl(token, {
                filename: file.name,
                contentType: file.type,
                fileSize: file.size,
                tripId: trip.id,
              });
              await uploadToPresignedUrl(presigned.uploadUrl, file);
              await updateMedia(token, presigned.mediaId, { locationId: location.id });
              ids.push(presigned.mediaId);
            } catch (err) {
              console.error("Photo upload failed", err);
            }
          }
          return ids;
        }),
      );

      // Use the first successfully uploaded photo as the trip cover.
      const firstPhotoId = uploadedIds.flat()[0];
      if (firstPhotoId) {
        try {
          await updateTrip(token, trip.id, { coverPhotoId: firstPhotoId });
        } catch (err) {
          console.error("Failed to set cover photo", err);
        }
      }

      router.push(`/trips/${trip.id}/wander`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        New Trip
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-lg w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">Create New Trip</h2>
            <p className="text-text-secondary mb-6">
              Add the places you went, a memory for each, and a few photos — we&apos;ll build the page and match
              the atmosphere to each destination.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Trip Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Kyoto Cherry Blossom Season"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-4">
                {destinations.map((dest, idx) => (
                  <div key={dest.key} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">Destination {idx + 1}</span>
                      {destinations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDestination(dest.key)}
                          className="text-text-secondary hover:text-error"
                          aria-label="Remove destination"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={dest.name}
                        onChange={(e) => updateDestination(dest.key, { name: e.target.value })}
                        placeholder="Place name"
                        className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        value={dest.country}
                        onChange={(e) => updateDestination(dest.key, { country: e.target.value })}
                        placeholder="Country (optional)"
                        className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <textarea
                      value={dest.notes}
                      onChange={(e) => updateDestination(dest.key, { notes: e.target.value })}
                      placeholder="The memory you want to keep from here..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                      <ImagePlus className="w-4 h-4" />
                      {dest.files.length > 0 ? `${dest.files.length} photo(s) selected` : "Add photos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => updateDestination(dest.key, { files: Array.from(e.target.files || []) })}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addDestination}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add another destination
              </button>

              {error && <p className="text-sm text-error">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" fullWidth onClick={close} disabled={submitting}>
                Cancel
              </Button>
              <Button fullWidth onClick={handleCreate} isLoading={submitting}>
                Create Trip
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
