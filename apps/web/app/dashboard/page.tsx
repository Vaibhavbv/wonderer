import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Navbar } from "@/components/layout/navbar";
import { TripGrid } from "@/components/dashboard/trip-grid";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CreateTripButton } from "@/components/dashboard/create-trip-button";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-text-primary">Your Trips</h1>
              <p className="text-text-secondary mt-1">Manage and create your travel stories</p>
            </div>
            <CreateTripButton />
          </div>
          <StatsCards />
          <div className="mt-10">
            <TripGrid />
          </div>
        </div>
      </main>
    </div>
  );
}
