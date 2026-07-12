"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { TextReveal } from "@/components/ui/text-reveal";
import { GlowSurface } from "@/components/ui/glow-surface";
import { SignInButton } from "@clerk/nextjs";

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* On the dark theme the CTA pops UP as an elevated glowing card
            instead of dimming down into a darker band. */}
        <GlowSurface
          className="rounded-3xl border border-border bg-surface-elevated px-6 py-16 text-center sm:px-12"
          glowColor="255, 90, 77"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-tight">
              <TextReveal text="Your travels deserve a map." />
            </h2>
            <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
              Join the travelers and nomads showing the world where they&apos;ve been — and where they&apos;re headed next.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Magnetic>
                <SignInButton mode="modal">
                  <Button size="lg" className="group">
                    Start your map — free
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </SignInButton>
              </Magnetic>
              <Magnetic>
                <Link href="/discover">
                  <Button variant="ghost" size="lg">
                    Explore journeys
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </motion.div>
        </GlowSurface>
      </div>
    </section>
  );
}
