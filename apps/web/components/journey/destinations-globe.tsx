"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "@/components/three/globe";
import { ParticleBackground } from "@/components/three/particle-background";
import type { Destination } from "@/lib/journey-data";

export function DestinationsGlobe({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const [active, setActive] = useState(destinations[0]);

  return (
    <div className="relative mb-14 h-[420px] sm:h-[520px] overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-950 to-neutral-900">
      <ParticleBackground color="#ffffff" count={200} />
      <Globe
        destinations={destinations}
        active={active}
        onSelect={(dest) => {
          setActive(dest);
          router.push(`/destinations/${dest.id}`);
        }}
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8 bg-gradient-to-t from-black/70 to-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">{active.country}</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-white">{active.name}</h2>
            <p className="text-sm text-white/70 mt-1">Drag to orbit · click a pin to jump in</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
