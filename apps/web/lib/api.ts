const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// The API wraps every response as { success, data, error }. This unwraps it.
async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const message = json?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return json.data as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface PublicUser {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
}

export interface ProfileStats {
  tripsCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
}

export interface Profile extends PublicUser {
  stats: ProfileStats;
  isFollowing: boolean;
  isSelf: boolean;
}

export interface TripLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  city: string | null;
  order: number;
}

export interface FeedTrip {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  photosCount: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  coverPhoto: { id: string; variants: unknown; originalUrl: string } | null;
  locations: TripLocation[];
  user: PublicUser;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  empty?: boolean;
}

// Server-side fetch (no auth) for public, SEO'd pages.
export async function getProfile(username: string): Promise<Profile> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}`, {
    next: { revalidate: 30 },
  });
  return unwrap<Profile>(res);
}

export async function getProfileTrips(username: string): Promise<Paginated<FeedTrip>> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/trips`, {
    next: { revalidate: 30 },
  });
  return unwrap<Paginated<FeedTrip>>(res);
}

export async function getDiscover(): Promise<Paginated<FeedTrip>> {
  const res = await fetch(`${API_URL}/v1/discover`, { next: { revalidate: 30 } });
  return unwrap<Paginated<FeedTrip>>(res);
}

export interface Me {
  id: string;
  username: string | null;
}

// Client-side authenticated fetch for the signed-in user's own record.
export async function getMe(token: string): Promise<Me> {
  const res = await fetch(`${API_URL}/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<Me>(res);
}
