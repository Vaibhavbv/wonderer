import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";

// Signed-out homepage: lightweight landing (no WebGL — 3D is paused on
// marketing surfaces per #18; the journey scene still lives at
// /trips/[id]/wander) followed by the marketing story and CTA.
export function MarketingHome() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
