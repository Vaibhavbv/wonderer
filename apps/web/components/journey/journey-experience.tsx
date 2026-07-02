"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
  AnimatePresence,
  type MotionValue,
} from "framer-motion";
import { journey, type Destination } from "@/lib/journey-data";
import { JourneyNav } from "./journey-nav";
import { DestinationCard } from "./destination-card";
import { ParticleField } from "./particle-field";
import { RouteVehicle } from "./route-vehicle";
import { TextReveal } from "@/components/ui/text-reveal";

// The WebGL journey scene is heavy — load it only on the client, after paint.
const JourneyScene = dynamic(
  () => import("@/components/three/journey-scene").then((m) => m.JourneyScene),
  { ssr: false }
);

const ease = [0.16, 1, 0.3, 1] as const;

export function JourneyExperience({
  destinations = journey,
  cardHrefBase,
}: {
  destinations?: Destination[];
  cardHrefBase?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Resolve motion preference only after mount: the server can't know it,
  // and branching on it during hydration would mismatch the SSR HTML.
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const show3D = mounted && !prefersReduced;
  const showFallback = mounted && !!prefersReduced;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // A gentle spring so the whole scene glides instead of snapping.
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 28, mass: 0.6 });

  const n = destinations.length;
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    if (i !== active) setActive(i);
  });

  const dest = destinations[active];

  return (
    <div ref={containerRef} style={{ height: `${(n + 1) * 100}vh` }} className="relative bg-black">
      {/* Fixed cinematic stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* The living 3D world: globe, stars, route, vehicle, weather */}
        {show3D && (
          <JourneyScene destinations={destinations} progress={progress} active={dest} />
        )}

        {/* Crossfading destination photographs — they part like curtains
            between stops, revealing the globe fly-through underneath */}
        {destinations.map((d, i) => (
          <BackgroundLayer key={d.id} dest={d} index={i} total={n} progress={progress} />
        ))}

        {/* Atmospheric theme gradient (shifts per destination) */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={dest.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${dest.theme.from}55 0%, transparent 35%, ${dest.theme.to}cc 100%)`,
            }}
          />
        </AnimatePresence>

        {/* Vignette for cinematic depth + text legibility */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

        {/* Reduced-motion fallback: the original 2D atmosphere + route */}
        {showFallback && (
          <>
            <ParticleField accent={dest.theme.accent} variant={dest.theme.particle} />
            <RouteVehicle progress={progress} accent={dest.theme.accent} vehicle={dest.vehicle} />
          </>
        )}

        {/* Giant destination name, magazine style */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={dest.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease }}
              className="text-center px-6"
            >
              <p className="text-white/70 text-sm sm:text-base tracking-[0.3em] uppercase mb-3">
                <TextReveal text={dest.country ?? ""} by="word" delay={0.3} />
              </p>
              <h2
                className="font-heading text-white text-6xl sm:text-8xl lg:text-[9rem] leading-[0.9] drop-shadow-2xl"
                style={{ textShadow: `0 0 80px ${dest.theme.accent}66` }}
              >
                <TextReveal text={dest.name} by="char" blur stagger={0.035} />
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating glass destination card */}
        <div className="absolute bottom-10 right-4 sm:right-10 z-20">
          <AnimatePresence mode="wait">
            <DestinationCard key={dest.id} dest={dest} href={cardHrefBase ? `${cardHrefBase}/${dest.id}` : undefined} />
          </AnimatePresence>
        </div>

        {/* Progress indicator — the itinerary */}
        <div className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-3">
          {destinations.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3">
              <div
                className="h-px transition-all duration-500"
                style={{
                  width: i === active ? 28 : 12,
                  background: i === active ? dest.theme.accent : "rgba(255,255,255,0.35)",
                  boxShadow: i === active ? `0 0 12px ${dest.theme.accent}` : "none",
                }}
              />
              <span
                className="text-xs transition-all duration-500"
                style={{
                  color: i === active ? "#fff" : "rgba(255,255,255,0.4)",
                  opacity: i === active ? 1 : 0.6,
                  textShadow: i === active ? `0 0 14px ${dest.theme.accent}` : "none",
                }}
              >
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <JourneyNav accent={dest.theme.accent} />
      <ScrollCue />
    </div>
  );
}

function BackgroundLayer({
  dest,
  index,
  total,
  progress,
}: {
  dest: Destination;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const center = (index + 0.5) / total;
  // Tighter span than before: photos fully clear the stage between stops so
  // the camera fly-through over the globe carries the transition.
  const span = 0.62 / total;
  const opacity = useTransform(progress, [center - span, center, center + span], [0, 0.92, 0]);
  const scale = useTransform(progress, [center - span, center, center + span], [1.18, 1.06, 1.18]);
  if (!dest.image) {
    return (
      <motion.div
        className="absolute inset-0"
        style={{ opacity, background: `linear-gradient(160deg, ${dest.theme.from}, ${dest.theme.to})` }}
      />
    );
  }
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <motion.img src={dest.image} alt={dest.name} style={{ scale }} className="h-full w-full object-cover" />
    </motion.div>
  );
}

function ScrollCue() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.div
      animate={{ opacity: hidden ? 0 : 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 text-white/70"
    >
      <span className="text-xs tracking-[0.25em] uppercase">Scroll to travel</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-8 w-px bg-gradient-to-b from-white/70 to-transparent"
      />
    </motion.div>
  );
}
