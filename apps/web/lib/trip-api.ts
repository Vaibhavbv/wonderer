import { API_URL, ApiError, authHeaders, unwrap, unwrapWithMeta } from "./api";

export interface DestinationTheme {
  from: string;
  to: string;
  accent: string;
  particle: "petals" | "snow" | "sun" | "sand" | "mist" | "stars" | "leaves";
}

export interface LocationInput {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  notes?: string;
}

export interface CreateTripInput {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  privacy?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  tags?: string[];
  locations?: LocationInput[];
}

export interface TripMediaRecord {
  id: string;
  locationId: string | null;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  originalUrl: string;
  variants: Record<string, { url: string }> | null;
  caption: string | null;
  order: number;
}

export interface TripLocationRecord {
  id: string;
  tripId: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  city: string | null;
  order: number;
  notes: string | null;
  theme: DestinationTheme | null;
}

export interface TripRecord {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  privacy: "PRIVATE" | "UNLISTED" | "PUBLIC";
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  locations: TripLocationRecord[];
  media: TripMediaRecord[];
  coverPhoto: TripMediaRecord | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

// Lightweight shape returned by the list endpoint (no media included).
export interface TripSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  privacy: "PRIVATE" | "UNLISTED" | "PUBLIC";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  photosCount: number;
  videosCount: number;
  storyBlocksCount: number;
  locations: { name: string; country: string | null }[];
  coverPhoto: { id: string; variants: Record<string, { url: string }> | null; originalUrl: string } | null;
}

export async function getTrips(token: string): Promise<{ items: TripSummary[]; total: number }> {
  const res = await fetch(`${API_URL}/v1/trips?per_page=50&sort=created_at:desc`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  const { data, meta } = await unwrapWithMeta<TripSummary[], { total?: number }>(res);
  const items = data ?? [];
  return { items, total: meta?.total ?? items.length };
}

export async function createTrip(token: string, input: CreateTripInput): Promise<TripRecord> {
  const res = await fetch(`${API_URL}/v1/trips`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<TripRecord>(res);
}

export interface UpdateTripInput {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  privacy?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  coverPhotoId?: string;
}

export async function updateTrip(
  token: string,
  tripId: string,
  input: UpdateTripInput,
): Promise<TripRecord> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<TripRecord>(res);
}

export async function deleteTrip(token: string, tripId: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}`, {
    method: "DELETE",
    headers: authHeaders(token, false),
  });
  // 204 No Content on success — nothing to unwrap.
  if (!res.ok) await unwrap(res);
}

export async function getTrip(token: string, tripId: string): Promise<TripRecord> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return unwrap<TripRecord>(res);
}

export interface PresignedUrlInput {
  filename: string;
  contentType: string;
  fileSize: number;
  tripId: string;
}

export interface PresignedUrlResponse {
  mediaId: string;
  uploadUrl: string;
  uploadFields: { key: string };
  publicUrl: string;
  expiresAt: string;
}

export async function getPresignedUrl(
  token: string,
  input: PresignedUrlInput,
): Promise<PresignedUrlResponse> {
  const res = await fetch(`${API_URL}/v1/media/presigned-url`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<PresignedUrlResponse>(res);
}

export async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new ApiError(`Upload failed (${res.status})`, res.status);
}

export interface UpdateMediaInput {
  caption?: string;
  locationId?: string;
}

export async function updateMedia(
  token: string,
  mediaId: string,
  input: UpdateMediaInput,
): Promise<TripMediaRecord> {
  const res = await fetch(`${API_URL}/v1/media/${encodeURIComponent(mediaId)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<TripMediaRecord>(res);
}

export async function deleteMedia(token: string, mediaId: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/media/${encodeURIComponent(mediaId)}`, {
    method: "DELETE",
    headers: authHeaders(token, false),
  });
  if (!res.ok) await unwrap(res);
}

// ---- Trip locations (post-create itinerary editing) ----

export interface CreateLocationInput {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  notes?: string;
}

export type UpdateLocationInput = Partial<CreateLocationInput>;

export async function addLocation(
  token: string,
  tripId: string,
  input: CreateLocationInput,
): Promise<TripLocationRecord> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/locations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<TripLocationRecord>(res);
}

export async function updateLocation(
  token: string,
  tripId: string,
  locationId: string,
  input: UpdateLocationInput,
): Promise<TripLocationRecord> {
  const res = await fetch(
    `${API_URL}/v1/trips/${encodeURIComponent(tripId)}/locations/${encodeURIComponent(locationId)}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(input),
    },
  );
  return unwrap<TripLocationRecord>(res);
}

export async function deleteLocation(
  token: string,
  tripId: string,
  locationId: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/v1/trips/${encodeURIComponent(tripId)}/locations/${encodeURIComponent(locationId)}`,
    {
      method: "DELETE",
      headers: authHeaders(token, false),
    },
  );
  if (!res.ok) await unwrap(res);
}

// locationIds must contain every location of the trip exactly once, in the
// desired order. Returns the reordered list.
export async function reorderLocations(
  token: string,
  tripId: string,
  locationIds: string[],
): Promise<TripLocationRecord[]> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/locations/order`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ locationIds }),
  });
  return unwrap<TripLocationRecord[]>(res);
}

export async function likeTrip(token: string, tripId: string): Promise<{ liked: boolean }> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ liked: boolean }>(res);
}

export async function unlikeTrip(token: string, tripId: string): Promise<{ liked: boolean }> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/like`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ liked: boolean }>(res);
}
