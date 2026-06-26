"use client";

import { useEffect, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
        const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/relationship`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (active && json?.data) {
          setFollowing(Boolean(json.data.isFollowing));
          setIsSelf(Boolean(json.data.isSelf));
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
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/v1/profiles/${encodeURIComponent(username)}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFollowing(!following);
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
