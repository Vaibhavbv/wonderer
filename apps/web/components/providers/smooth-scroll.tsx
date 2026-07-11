"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide inertia scrolling via Lenis. Native scroll position still moves,
 * so framer-motion's useScroll and browser anchors keep working — Lenis just
 * eases the journey there. Disabled for prefers-reduced-motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
