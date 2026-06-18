import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TripDetail } from "@/components/trips/trip-detail";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <TripDetail tripId={id} />
      </main>
    </div>
  );
}
