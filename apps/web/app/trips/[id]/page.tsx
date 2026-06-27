import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TripDetail } from "@/components/trips/trip-detail";
import { getTrip } from "@/lib/trip-api";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <TripDetail trip={trip} />
      </main>
    </div>
  );
}
