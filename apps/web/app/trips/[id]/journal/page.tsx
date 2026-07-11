import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { JournalEditor } from "@/components/journal/journal-editor";
import { getTrip } from "@/lib/trip-api";
import { getMyProfile } from "@/lib/users-api";
import { ApiError } from "@/lib/api";

export default async function TripJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/");

  const { id } = await params;
  const token = await getToken();
  if (!token) redirect("/");

  let trip;
  try {
    trip = await getTrip(token, id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  // The story API itself enforces write permissions (owner or non-VIEWER
  // collaborator); this flag only decides whether to render editing chrome.
  const me = await getMyProfile(token).catch(() => null);
  const canEdit = Boolean(me && me.id === trip.userId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <JournalEditor trip={trip} canEdit={canEdit} />
      </main>
    </div>
  );
}
