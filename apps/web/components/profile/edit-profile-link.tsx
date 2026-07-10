"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyUsername } from "@/lib/use-my-username";

// Shows an "Edit profile" affordance only when viewing your own profile.
export function EditProfileLink({ username }: { username: string }) {
  const myUsername = useMyUsername();
  if (!myUsername || myUsername !== username) return null;

  return (
    <Link href="/settings/profile">
      <Button variant="outline" size="sm">
        <Pencil className="mr-2 h-3.5 w-3.5" />
        Edit profile
      </Button>
    </Link>
  );
}
