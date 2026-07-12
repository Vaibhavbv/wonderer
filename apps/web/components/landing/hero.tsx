"use client";

import { motion } from "framer-motion";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Lightweight editorial hero — no WebGL. Replaces the heavy scroll-driven 3D
 * globe on the landing page while we focus on core functionality. The 3D
 * journey experience still lives in components/three + components/journey and
 * can be re-enabled later.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-4 py-1.5 text-sm text-text-secondary shadow-sm"
        >
          <MapPin className="w-4 h-4 text-primary-500" />
          The social network for travel
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 font-heading text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-text-primary"
        >
          Map your life.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Your profile is a living map of everywhere you&apos;ve ever been. Follow
          friends and creators, and watch their journeys unfold.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <SignInButton mode="modal">
            <Button size="lg" className="group">
              Start your map — free
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </SignInButton>
          <Link href="/discover">
            <Button variant="outline" size="lg">
              Explore journeys
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
