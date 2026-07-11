import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";

export const metadata: Metadata = {
  title: "Pricing — Wanderverse",
  description: "Simple, transparent pricing. Start free, upgrade when you need more.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
