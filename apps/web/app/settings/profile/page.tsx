import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata = { title: "Edit profile — Wanderverse" };

export default async function ProfileSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 text-center">
            <p className="text-sm uppercase tracking-widest text-primary-400">Settings</p>
            <h1 className="mt-2 font-heading text-3xl text-text-primary">Your profile</h1>
            <p className="mt-2 text-text-secondary">How other travelers see you.</p>
          </header>
          <ProfileEditor />
        </div>
      </main>
      <Footer />
    </div>
  );
}
