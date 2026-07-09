import { JourneyExperience } from "@/components/journey/journey-experience";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";

// Signed-out homepage: the cinematic demo journey, then the marketing story
// (previously orphaned on /about) so new visitors learn what this is and get
// a CTA without hunting for it.
export function MarketingHome() {
  return (
    <>
      <JourneyExperience cardHrefBase="/destinations" />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </>
  );
}
