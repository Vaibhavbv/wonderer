"use client";

import { useEffect, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { followUser, getRelationship, unfollowUser } from "@/lib/social-api";

export function FollowButton({ username }: { username: string }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [following, setFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const rel = await getRelationship(token, username);
        if (active) {
          setFollowing(rel.isFollowing);
          setIsSelf(rel.isSelf);
        }
      } catch {
        /* ignore — leave default state */
      }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, username, getToken]);

  if (!isLoaded) {
    return <Button variant="outline" disabled>···</Button>;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="primary">Follow</Button>
      </SignInButton>
    );
  }

  if (isSelf) {
    return <Button variant="outline" disabled>Your profile</Button>;
  }

  async function toggle() {
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) return;
      if (following) {
        await unfollowUser(token, username);
        setFollowing(false);
      } else {
        await followUser(token, username);
        setFollowing(true);
      }
    } catch {
      /* keep previous state on failure */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={following ? "outline" : "primary"} onClick={toggle} isLoading={busy}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
