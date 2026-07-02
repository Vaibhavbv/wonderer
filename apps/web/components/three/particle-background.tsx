"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Drift({ color, count }: { color: string; count: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.035} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/**
 * Dimensional particle drift for dark hero/CTA sections — a depth cue
 * behind the flat CSS cursor-glow rather than a replacement for it.
 */
export function ParticleBackground({
  color = "#ffffff",
  count = 300,
  className,
}: {
  color?: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={className ?? "pointer-events-none absolute inset-0"} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }} dpr={[1, 1.5]}>
        <Drift color={color} count={count} />
      </Canvas>
    </div>
  );
}
