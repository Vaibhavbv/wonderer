"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, X, ImagePlus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrip, updateTrip } from "@/lib/trip-api";
import { uploadTripPhotos } from "@/lib/upload";

interface DraftDestination {
  key: string;
  name: string;
  country: string;
  notes: string;
  latitude: string;
  longitude: string;
  showCoords: boolean;
  files: File[];
}

function emptyDestination(): DraftDestination {
  return {
    key: Math.random().toString(36).slice(2),
    name: "",
    country: "",
    notes: "",
    latitude: "",
    longitude: "",
    showCoords: false,
    files: [],
  };
}

function parseCoord(value: string, min: number, max: number): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
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
          // Coordinates are optional here — you can set them later in Edit
          // trip; 0,0 marks "not placed yet".
          latitude: parseCoord(d.latitude, -90, 90) ?? 0,
          longitude: parseCoord(d.longitude, -180, 180) ?? 0,
        })),
      });

      const uploadedIds = await Promise.all(
        trip.locations.map(async (location, idx) => {
          const files = validDestinations[idx]?.files ?? [];
          const { uploadedIds: ids } = await uploadTripPhotos(token, trip.id, files, location.id);
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
      <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>
              Add the places you went, a memory for each, and a few photos — we&apos;ll build the page and match
              the atmosphere to each destination.
            </DialogDescription>
          </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="trip-title">Trip Title</Label>
                <Input
                  id="trip-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Kyoto Cherry Blossom Season"
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
                      <Input
                        type="text"
                        value={dest.name}
                        onChange={(e) => updateDestination(dest.key, { name: e.target.value })}
                        placeholder="Place name"
                      />
                      <Input
                        type="text"
                        value={dest.country}
                        onChange={(e) => updateDestination(dest.key, { country: e.target.value })}
                        placeholder="Country (optional)"
                      />
                    </div>
                    <Textarea
                      value={dest.notes}
                      onChange={(e) => updateDestination(dest.key, { notes: e.target.value })}
                      placeholder="The memory you want to keep from here..."
                      rows={2}
                    />
                    {dest.showCoords ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          step="any"
                          value={dest.latitude}
                          onChange={(e) => updateDestination(dest.key, { latitude: e.target.value })}
                          placeholder="Latitude (−90…90)"
                        />
                        <Input
                          type="number"
                          step="any"
                          value={dest.longitude}
                          onChange={(e) => updateDestination(dest.key, { longitude: e.target.value })}
                          placeholder="Longitude (−180…180)"
                        />
                        <p className="col-span-2 text-xs text-text-tertiary">
                          These place the pin on your journey globe. Blank is fine — set them later in Edit trip.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateDestination(dest.key, { showCoords: true })}
                        className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-primary-400"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Add coordinates (places the globe pin)
                      </button>
                    )}
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
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add another destination
              </button>

              {error && <p className="text-sm text-error">{error}</p>}
            </div>

          <DialogFooter>
            <Button variant="outline" fullWidth onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleCreate} isLoading={submitting}>
              Create Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
