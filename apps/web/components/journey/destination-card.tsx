"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, Clock, Heart, CloudSun, Sparkles } from "lucide-react";
import type { Destination } from "@/lib/journey-data";

const ease = [0.16, 1, 0.3, 1] as const;

export function DestinationCard({ dest, href }: { dest: Destination; href?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 160, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 160, damping: 18 });
  const sheenX = useTransform(rotateY, [-8, 8], ["30%", "70%"]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 14);
    rx.set(-py * 10);
  }
  function onPointerLeave() {
    rx.set(0);
    ry.set(0);
  }

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={{ duration: 0.7, ease }}
      style={{ perspective: 900 }}
    >
    <motion.div
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
    >
    <motion.div
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`relative w-[300px] sm:w-[340px] overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-2xl shadow-2xl ${
        href ? "cursor-pointer transition-colors hover:border-white/30" : ""
      }`}
      style={{
        boxShadow: `0 20px 60px -20px ${dest.theme.accent}55`,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      {/* glass reflection that slides with the tilt */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background: useTransform(
            sheenX,
            (x) => `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.09) ${x}, transparent 65%)`
          ),
        }}
      />
      <div
        className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl"
        style={!dest.image ? { background: `linear-gradient(160deg, ${dest.theme.from}, ${dest.theme.to})` } : undefined}
      >
        {dest.image && <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-3 text-white font-heading text-2xl drop-shadow">
          {dest.name}
        </span>
      </div>

      <p className="text-sm italic text-white/80 mb-4">&ldquo;{dest.mood}&rdquo;</p>

      <div className="grid grid-cols-2 gap-y-3 text-white/75 text-[13px]">
        {dest.date && <Row icon={<Calendar className="h-4 w-4" />} label={dest.date} />}
        {dest.days !== undefined && <Row icon={<Clock className="h-4 w-4" />} label={`${dest.days} days`} />}
        <Row icon={<Heart className="h-4 w-4" />} label={`${dest.memories} memories`} />
        {dest.weather && <Row icon={<CloudSun className="h-4 w-4" />} label={dest.weather} />}
      </div>

      {dest.favorite && (
        <div className="mt-4 flex items-start gap-2 border-t border-white/10 pt-3">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: dest.theme.accent }} />
          <p className="text-[13px] text-white/85">{dest.favorite}</p>
        </div>
      )}
    </motion.div>
    </motion.div>
    </motion.div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/50">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
