import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WanderView } from "@/components/story/wander-view";

export default async function WanderPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  const { id } = await params;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <WanderView tripId={id} />
    </div>
  );
}
