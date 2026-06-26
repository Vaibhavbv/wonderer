"use client";

import { motion } from "framer-motion";
import { ChevronRight, Plane } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Full-bleed editorial photograph */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2000&q=80&auto=format&fit=crop"
          alt="A winding road through dramatic mountains at golden hour"
          className="h-full w-full object-cover"
        />
        {/* Legibility scrim — darker at the bottom where the text sits */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/30 to-neutral-900/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="flex items-center gap-2 text-white/90 text-sm font-medium tracking-wide uppercase"
        >
          <Plane className="w-4 h-4 text-primary-400" />
          The social network for travel
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease }}
          className="mt-5 font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.95] tracking-tight"
        >
          Map your life.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="mt-6 text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed"
        >
          Your profile is a living map of everywhere you&apos;ve ever been. Follow friends and
          creators, and watch their journeys unfold.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <SignInButton mode="modal">
            <Button size="lg" className="group">
              Start your map
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </SignInButton>
          <Link href="/discover">
            <Button
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
            >
              Explore journeys
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
