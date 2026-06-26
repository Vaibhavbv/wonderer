"use client";

import { useRef, useEffect } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import type { Vehicle } from "@/lib/journey-data";

// A hand-drawn, winding route that snakes down the screen. The trail draws
// progressively and the vehicle rides along it as the user scrolls.
const PATH =
  "M120,80 C320,180 80,320 280,420 C460,510 220,640 360,760 C470,860 760,820 720,980 C690,1120 360,1120 420,1280 C470,1410 820,1360 800,1520 C785,1660 380,1640 460,1820 C520,1950 840,1900 880,2020";

const VEHICLE_GLYPH: Record<Vehicle, string> = {
  // simple, brand-coral silhouettes drawn around origin (0,0)
  plane: "M-10,0 L8,-4 L8,4 Z M2,-3 L2,3",
  van: "M-11,3 L-11,-3 L4,-3 L9,1 L11,1 L11,3 Z",
  jeep: "M-10,3 L-10,-2 L-4,-2 L-1,-5 L6,-5 L9,-2 L10,-2 L10,3 Z",
  motorcycle: "M-9,2 L-2,2 L1,-3 L6,-3 L9,2",
  train: "M-11,3 L-11,-4 L9,-4 L11,-1 L11,3 Z",
  balloon: "M0,-9 a6,6 0 1,0 0.1,0 Z M-3,3 L3,3 L2,6 L-2,6 Z",
};

export function RouteVehicle({
  progress,
  accent,
  vehicle,
}: {
  progress: MotionValue<number>;
  accent: string;
  vehicle: Vehicle;
}) {
  const trailRef = useRef<SVGPathElement>(null);
  const baseRef = useRef<SVGPathElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const lenRef = useRef(0);

  useEffect(() => {
    const p = baseRef.current;
    if (!p) return;
    lenRef.current = p.getTotalLength();
    if (trailRef.current) {
      trailRef.current.style.strokeDasharray = `${lenRef.current}`;
      trailRef.current.style.strokeDashoffset = `${lenRef.current}`;
    }
  }, []);

  const update = (v: number) => {
    const len = lenRef.current;
    const base = baseRef.current;
    if (!len || !base) return;
    const t = Math.min(1, Math.max(0, v));
    if (trailRef.current) {
      trailRef.current.style.strokeDashoffset = `${len * (1 - t)}`;
    }
    const pt = base.getPointAtLength(len * t);
    const ahead = base.getPointAtLength(Math.min(len, len * t + 1));
    const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
    if (vehicleRef.current) {
      vehicleRef.current.setAttribute("transform", `translate(${pt.x},${pt.y}) rotate(${angle})`);
    }
  };

  useMotionValueEvent(progress, "change", update);
  useEffect(() => {
    update(progress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 2100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* faint full route */}
      <path ref={baseRef} d={PATH} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" />
      {/* glowing drawn trail */}
      <path
        ref={trailRef}
        d={PATH}
        fill="none"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${accent})`, transition: "stroke 0.8s ease" }}
      />
      {/* vehicle */}
      <g ref={vehicleRef}>
        <circle r="15" fill={accent} opacity="0.18" />
        <circle r="7" fill={accent} style={{ transition: "fill 0.8s ease" }} />
        <path
          d={VEHICLE_GLYPH[vehicle]}
          fill="none"
          stroke="#0c0c0c"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
