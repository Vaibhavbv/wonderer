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
    <GlowSurface as="section" className="py-24 sm:py-32 bg-neutral-900" glowColor="232, 93, 76">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
            <TextReveal text="Your travels deserve a map." />
          </h2>
          <p className="mt-5 text-lg text-white/70 max-w-2xl mx-auto">
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
                <Button variant="ghost" size="lg" className="text-white/80 hover:text-white hover:bg-white/10">
                  Explore journeys
                </Button>
              </Link>
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </GlowSurface>
  );
}
