"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { AtSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { getMyProfile, updateMe, type MeProfile } from "@/lib/users-api";

const BIO_MAX = 500;

export function ProfileEditor() {
  const { getToken } = useAuth();
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const [me, setMe] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in");
        const profile = await getMyProfile(token);
        if (!active) return;
        setMe(profile);
        setDisplayName(profile.displayName ?? "");
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setLocation(profile.location ?? "");
        setWebsite(profile.website ?? "");
        setAvatarUrl(profile.avatarUrl ?? "");
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : "Couldn't load your profile");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getToken]);

  async function save() {
    setSaving(true);
    setError(null);
    setUsernameError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const trimmedUsername = username.trim();
      const updated = await updateMe(token, {
        displayName: displayName.trim() || undefined,
        ...(trimmedUsername && trimmedUsername !== me?.username && { username: trimmedUsername }),
        bio: bio.trim(),
        location: location.trim(),
        ...(website.trim() && { website: website.trim() }),
        ...(avatarUrl.trim() && { avatarUrl: avatarUrl.trim() }),
      });
      setMe(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Navbar's profile link and any username-derived UI must re-resolve.
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setUsernameError("That username is taken — try another.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-text-tertiary">Loading your profile…</p>;
  }

  if (loadError) {
    return <p className="py-24 text-center text-error">{loadError}</p>;
  }

  const initials = (displayName || username || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar preview" className="h-16 w-16 rounded-full border-2 border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/15 font-heading text-xl text-primary-400">
            {initials}
          </div>
        )}
        <div>
          <h2 className="font-heading text-xl text-text-primary">{displayName || "Unnamed traveler"}</h2>
          {me?.username ? (
            <p className="text-sm text-text-tertiary">@{me.username}</p>
          ) : (
            <p className="text-sm text-primary-400">No username yet — claim one below</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Display name</label>
          <Input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(null);
              }}
              className={`pl-9 ${usernameError ? "border-error focus-visible:border-error focus-visible:ring-error/30" : ""}`}
              placeholder="your-handle"
              maxLength={50}
            />
          </div>
          {usernameError ? (
            <p className="mt-1 text-xs text-error">{usernameError}</p>
          ) : (
            <p className="mt-1 text-xs text-text-tertiary">
              3–50 characters; letters, numbers, dots, dashes, underscores. Your profile lives at
              /profiles/{username.trim() || "your-handle"}.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={3}
           
            placeholder="Where you've been, where you're headed…"
          />
          <p className="mt-1 text-right text-xs text-text-tertiary">
            {bio.length}/{BIO_MAX}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Location</label>
            <Input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lisbon, Portugal" maxLength={100} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Website</label>
            <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" maxLength={200} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Avatar URL</label>
          <Input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…/you.jpg" />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button onClick={save} isLoading={saving}>
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
