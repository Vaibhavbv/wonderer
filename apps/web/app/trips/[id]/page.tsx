import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TripDetail } from "@/components/trips/trip-detail";
import { getTrip } from "@/lib/trip-api";
import { getMyProfile } from "@/lib/users-api";
import { ApiError } from "@/lib/api";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
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

  const me = await getMyProfile(token).catch(() => null);
  const viewerIsOwner = Boolean(me && me.id === trip.userId);

  return (
    <AppSidebar>
      <div className="pt-2 sm:pt-4">
        <TripDetail trip={trip} viewerIsOwner={viewerIsOwner} />
      </div>
    </AppSidebar>
  );
}
