import { API_URL, authHeaders, unwrap, type FeedTrip, type Paginated, type PublicUser } from "./api";

// Personalized home feed: published trips from everyone the viewer follows.
// data = { items, nextCursor, empty? } — empty means "follows nobody yet".
export async function getFeed(token: string, cursor?: string): Promise<Paginated<FeedTrip>> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_URL}/v1/feed${params}`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  return unwrap<Paginated<FeedTrip>>(res);
}

export interface Relationship {
  isFollowing: boolean;
  isSelf: boolean;
}

export async function getRelationship(token: string, username: string): Promise<Relationship> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/relationship`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  return unwrap<Relationship>(res);
}

export async function followUser(token: string, username: string): Promise<{ following: boolean }> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/follow`, {
    method: "POST",
    headers: authHeaders(token, false),
  });
  return unwrap<{ following: boolean }>(res);
}

export async function unfollowUser(token: string, username: string): Promise<{ following: boolean }> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
    headers: authHeaders(token, false),
  });
  return unwrap<{ following: boolean }>(res);
}

// Public relationship lists (no auth), newest follow first.
export async function getFollowers(username: string): Promise<PublicUser[]> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/followers`, {
    next: { revalidate: 30 },
  });
  return unwrap<PublicUser[]>(res);
}

export async function getFollowing(username: string): Promise<PublicUser[]> {
  const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/following`, {
    next: { revalidate: 30 },
  });
  return unwrap<PublicUser[]>(res);
}
