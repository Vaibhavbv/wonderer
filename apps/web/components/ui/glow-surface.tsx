"use client";

import { useRef, type ElementType, type ReactNode } from "react";

/**
 * Dark-container wrapper that tracks the cursor and feeds its position to
 * the `.glow-surface` CSS (see globals.css) as --mouse-x/--mouse-y, driving
 * a radial-gradient glow that follows the pointer. Pure CSS-variable writes
 * on mousemove — no re-renders.
 */
export function GlowSurface({
  children,
  className,
  glowColor = "255, 255, 255",
  glowOpacity = 0.12,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** "r, g, b" string, e.g. "232, 93, 76" */
  glowColor?: string;
  glowOpacity?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`glow-surface${className ? ` ${className}` : ""}`}
      style={
        {
          "--glow-color": glowColor,
          "--glow-opacity": glowOpacity,
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
