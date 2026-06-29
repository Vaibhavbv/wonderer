"use client";

import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Splits text into words or characters, each masked by an overflow-hidden
 * span so it can slide up from below the mask line — a clip-path-style
 * reveal done entirely with transform/opacity for GPU compositing.
 */
export function TextReveal({
  text,
  className,
  by = "word",
  delay = 0,
  stagger,
}: {
  text: string;
  className?: string;
  by?: "word" | "char";
  /** Seconds before the first piece starts animating. */
  delay?: number;
  /** Seconds between each piece. Defaults to 0.06 (word) / 0.02 (char). */
  stagger?: number;
}) {
  const pieces = by === "char" ? Array.from(text) : text.split(" ");
  const step = stagger ?? (by === "char" ? 0.02 : 0.06);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline">
        {pieces.map((piece, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 0.6, delay: delay + i * step, ease }}
            >
              {piece === " " ? " " : piece}
              {by === "word" && i < pieces.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </span>
  );
}
