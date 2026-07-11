"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const SPRING = { damping: 30, stiffness: 200, mass: 0.5 };

/**
 * Wraps any element (button, link) and pulls it gently toward the cursor
 * while hovered, snapping back with a spring once the pointer leaves.
 */
export function Magnetic({
  children,
  strength = 0.35,
  range = 90,
  className,
}: {
  children: React.ReactNode;
  /** How far the element travels relative to cursor offset (0-1). */
  strength?: number;
  /** Distance in px from center at which the pull starts fading to 0. */
  range?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(relX, relY);
    const falloff = Math.max(0, 1 - dist / range);
    x.set(relX * strength * falloff);
    y.set(relY * strength * falloff);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className ?? "inline-block will-change-transform"}
    >
      {children}
    </motion.div>
  );
}
