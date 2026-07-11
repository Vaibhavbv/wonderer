"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const SPRING = { damping: 30, stiffness: 200 };

/**
 * Wraps a card with a perspective-warped 3D tilt that follows the cursor,
 * plus a slight scale-up — high-tension spring rather than linear easing,
 * so it settles with a touch of overshoot instead of snapping back flat.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 10,
  liftScale = 1.035,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  liftScale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hovering = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), SPRING);
  const scale = useSpring(useTransform(hovering, [0, 1], [1, liftScale]), SPRING);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseEnter() {
    hovering.set(1);
  }

  function handleMouseLeave() {
    px.set(0.5);
    py.set(0.5);
    hovering.set(0);
  }

  return (
    <div className="perspective-card">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        className={cn("will-change-transform", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
