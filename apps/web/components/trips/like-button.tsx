"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { likeTrip, unlikeTrip } from "@/lib/trip-api";
import { cn } from "@/lib/utils";

export function LikeButton({
  tripId,
  initialLiked,
  initialCount,
}: {
  tripId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  if (!isLoaded) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Heart className="w-4 h-4 mr-2" />
        {initialCount.toLocaleString()}
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          <Heart className="w-4 h-4 mr-2" />
          {count.toLocaleString()}
        </Button>
      </SignInButton>
    );
  }

  async function toggle() {
    setBusy(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const token = await getToken();
      if (!token) return;
      if (nextLiked) await likeTrip(token, tripId);
      else await unlikeTrip(token, tripId);
    } catch {
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={liked ? "danger" : "outline"} size="sm" onClick={toggle} disabled={busy}>
      <Heart className={cn("w-4 h-4 mr-2", liked && "fill-current")} />
      {count.toLocaleString()}
    </Button>
  );
}
