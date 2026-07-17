"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

// Lightweight atmospheric particle field — drifting motes tinted to the
// active theme. One generic field reused across themes (petals, snow, sand…)
// by varying size, speed, and drift, so it reads as living atmosphere
// without a heavy particle engine.

type Variant = "petals" | "snow" | "sun" | "sand" | "mist" | "stars" | "leaves";

export function ParticleField({ accent, variant }: { accent: string; variant: Variant }) {
  // Hard brand constraint: prefers-reduced-motion means NO perpetual motion.
  // Reduced mode renders the motes as a static scatter so the atmosphere
  // keeps its texture without animating.
  const prefersReduced = useReducedMotion();

  const particles = useMemo(() => {
    const count = variant === "stars" ? 60 : 40;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 16,
      size: variant === "snow" || variant === "stars" ? 2 + Math.random() * 3 : 4 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 120,
      opacity: 0.25 + Math.random() * 0.5,
    }));
  }, [variant]);

  const rounded = variant !== "petals" && variant !== "leaves";
  const color = variant === "snow" || variant === "mist" || variant === "stars" ? "#ffffff" : accent;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={prefersReduced ? "absolute" : "absolute -top-10"}
          style={{
            left: `${p.left}%`,
            ...(prefersReduced && { top: `${p.top}%` }),
            width: p.size,
            height: p.size,
            opacity: prefersReduced ? p.opacity * 0.6 : p.opacity,
            background: color,
            borderRadius: rounded ? "9999px" : "40% 60% 55% 45%",
            // @ts-expect-error custom prop consumed by the keyframes
            "--drift": `${p.drift}px`,
            ...(!prefersReduced && { animation: `fall ${p.duration}s linear ${p.delay}s infinite` }),
            filter: variant === "stars" || variant === "sun" ? `drop-shadow(0 0 6px ${color})` : undefined,
          }}
        />
      ))}
      {!prefersReduced && (
        <style>{`
          @keyframes fall {
            0% { transform: translate(0, -5vh) rotate(0deg); }
            100% { transform: translate(var(--drift), 110vh) rotate(360deg); }
          }
        `}</style>
      )}
    </div>
  );
}
