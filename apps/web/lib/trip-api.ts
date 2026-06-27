import { ApiError } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const message = json?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return json.data as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

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
}

export async function createTrip(token: string, input: CreateTripInput): Promise<TripRecord> {
  const res = await fetch(`${API_URL}/v1/trips`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<TripRecord>(res);
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
