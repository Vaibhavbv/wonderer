import { API_URL, authHeaders, unwrap } from "./api";

// The signed-in user's own record (GET /v1/users/me select).
export interface MeProfile {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  timezone: string;
  language: string;
  unitSystem: string;
  emailNotifications: boolean;
  subscriptionTier: string;
  subscriptionStatus: string;
  aiCreditsUsed: number;
  aiCreditsQuota: number;
  tripCount: number;
  tripQuota: number;
  createdAt: string;
}

export interface UpdateMeInput {
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
}

export interface MyStats {
  tripsCount: number;
  mediaCount: number;
  followersCount: number;
  followingCount: number;
  totalViews: number;
}

export async function getMyProfile(token: string): Promise<MeProfile> {
  const res = await fetch(`${API_URL}/v1/users/me`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  return unwrap<MeProfile>(res);
}

// A taken username surfaces as ApiError with status 409.
export async function updateMe(token: string, input: UpdateMeInput): Promise<MeProfile> {
  const res = await fetch(`${API_URL}/v1/users/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<MeProfile>(res);
}

export async function getMyStats(token: string): Promise<MyStats> {
  const res = await fetch(`${API_URL}/v1/users/me/stats`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  return unwrap<MyStats>(res);
}
