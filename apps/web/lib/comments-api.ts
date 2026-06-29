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

export interface CommentAuthor {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentReply {
  id: string;
  tripId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user: CommentAuthor;
  isLiked: boolean;
}

export interface CommentRecord extends CommentReply {
  replies: CommentReply[];
}

export async function getComments(
  token: string,
  tripId: string,
  cursor?: string,
): Promise<{ items: CommentRecord[]; nextCursor: string | null }> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/comments${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status);
  }
  return { items: (json.data as CommentRecord[]) ?? [], nextCursor: json.meta?.nextCursor ?? null };
}

export async function createComment(
  token: string,
  tripId: string,
  input: { content: string; parentId?: string },
): Promise<CommentRecord> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/comments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<CommentRecord>(res);
}

export async function deleteComment(token: string, commentId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_URL}/v1/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ deleted: boolean }>(res);
}

export async function likeComment(token: string, commentId: string): Promise<{ liked: boolean }> {
  const res = await fetch(`${API_URL}/v1/comments/${encodeURIComponent(commentId)}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ liked: boolean }>(res);
}

export async function unlikeComment(token: string, commentId: string): Promise<{ liked: boolean }> {
  const res = await fetch(`${API_URL}/v1/comments/${encodeURIComponent(commentId)}/like`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ liked: boolean }>(res);
}
