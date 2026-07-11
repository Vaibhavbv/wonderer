import { API_URL, authHeaders, unwrap, unwrapWithMeta } from "./api";

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
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  const { data, meta } = await unwrapWithMeta<CommentRecord[], { nextCursor?: string | null }>(res);
  return { items: data ?? [], nextCursor: meta?.nextCursor ?? null };
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
