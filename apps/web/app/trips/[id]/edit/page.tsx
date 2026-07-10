import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TripEditor } from "@/components/trips/trip-editor";
import { getTrip } from "@/lib/trip-api";
import { getMyProfile } from "@/lib/users-api";
import { ApiError } from "@/lib/api";

export default async function TripEditPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Owner-only for now — the API also allows EDITOR collaborators, but the
  // editor UI assumes full control (publish, delete).
  const me = await getMyProfile(token).catch(() => null);
  if (!me || me.id !== trip.userId) {
    redirect(`/trips/${id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <TripEditor trip={trip} />
      </main>
    </div>
  );
}
