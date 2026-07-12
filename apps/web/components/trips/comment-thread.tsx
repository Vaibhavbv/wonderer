"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Heart, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatRelativeDate } from "@/lib/utils";
import { getMe } from "@/lib/api";
import {
  getComments,
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
  type CommentRecord,
  type CommentReply,
  type CommentAuthor,
} from "@/lib/comments-api";

function authorName(user: CommentAuthor) {
  return user.displayName || user.username || "Someone";
}

export function CommentThread({ tripId, tripOwnerId }: { tripId: string; tripOwnerId: string }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [{ items }, me] = await Promise.all([getComments(token, tripId), getMe(token)]);
        if (active) {
          setComments(items);
          setViewerId(me.id);
        }
      } catch {
        /* ignore — leave empty */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, tripId, getToken]);

  async function refresh() {
    const token = await getToken();
    if (!token) return;
    const { items } = await getComments(token, tripId);
    setComments(items);
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await createComment(token, tripId, { content: text.trim() });
      setText("");
      await refresh();
    } finally {
      setPosting(false);
    }
  }

  async function submitReply(parentId: string, e: FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await createComment(token, tripId, { content: replyText.trim(), parentId });
      setReplyText("");
      setReplyTo(null);
      await refresh();
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const token = await getToken();
    if (!token) return;
    await deleteComment(token, commentId);
    await refresh();
  }

  function updateLikeState(c: CommentRecord, id: string, liked: boolean): CommentRecord {
    if (c.id === id) {
      return { ...c, isLiked: liked, likesCount: c.likesCount + (liked ? 1 : -1) };
    }
    return {
      ...c,
      replies: c.replies.map((r) =>
        r.id === id ? { ...r, isLiked: liked, likesCount: r.likesCount + (liked ? 1 : -1) } : r,
      ),
    };
  }

  async function handleToggleLike(comment: { id: string; isLiked: boolean }) {
    const token = await getToken();
    if (!token) return;
    setComments((prev) => prev.map((c) => updateLikeState(c, comment.id, !comment.isLiked)));
    try {
      if (comment.isLiked) await unlikeComment(token, comment.id);
      else await likeComment(token, comment.id);
    } catch {
      await refresh();
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-text-secondary mb-3">Sign in to see and join the conversation.</p>
        <SignInButton mode="modal">
          <Button variant="primary">Sign In</Button>
        </SignInButton>
      </div>
    );
  }

  function renderComment(c: CommentReply, isReply: boolean) {
    const canDelete = viewerId === c.userId || viewerId === tripOwnerId;
    return (
      <div key={c.id} className={isReply ? "ml-10 mt-3" : ""}>
        <div className="flex gap-3">
          {c.user.avatarUrl ? (
            <img
              src={c.user.avatarUrl}
              alt={authorName(c.user)}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-500/15 text-primary-400 flex items-center justify-center text-xs font-heading flex-shrink-0">
              {authorName(c.user).slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="bg-surface-pressed rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{authorName(c.user)}</span>
                <span className="text-xs text-text-tertiary">{formatRelativeDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
            </div>
            <div className="flex items-center gap-4 mt-1 ml-1 text-xs text-text-tertiary">
              <button
                onClick={() => handleToggleLike(c)}
                className={cn("flex items-center gap-1 hover:text-error transition-colors", c.isLiked && "text-error")}
              >
                <Heart className={cn("w-3.5 h-3.5", c.isLiked && "fill-current")} />
                {c.likesCount > 0 && c.likesCount}
              </button>
              {!isReply && (
                <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="hover:text-text-secondary">
                  Reply
                </button>
              )}
              {canDelete && (
                <button onClick={() => handleDelete(c.id)} className="hover:text-error" aria-label="Delete comment">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!isReply && replyTo === c.id && (
              <form onSubmit={(e) => submitReply(c.id, e)} className="flex gap-2 mt-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${authorName(c.user)}...`}
                  className="flex-1 rounded-full px-3 py-1.5"
                  autoFocus
                />
                <Button type="submit" size="sm" isLoading={posting} disabled={!replyText.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="comments" className="space-y-6">
      <form onSubmit={submitComment} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-full px-4 py-2"
        />
        <Button type="submit" isLoading={posting} disabled={!text.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-text-tertiary">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-text-tertiary">No comments yet. Be the first to say something.</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id}>
              {renderComment(c, false)}
              {c.replies.map((r) => renderComment(r, true))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
