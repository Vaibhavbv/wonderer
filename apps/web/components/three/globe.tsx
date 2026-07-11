"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import type { Destination } from "@/lib/journey-data";

const RADIUS = 2;

// Lat/lng (degrees) -> point on the sphere surface.
function toVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Pin({
  dest,
  position,
  isActive,
  onSelect,
}: {
  dest: Destination;
  position: THREE.Vector3;
  isActive: boolean;
  onSelect: (dest: Destination) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const scale = isActive || hovered ? 1.6 : 1;

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(dest);
        }}
        scale={scale}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={dest.theme.accent} toneMapped={false} />
      </mesh>
      <mesh scale={scale * 2.2}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={dest.theme.accent} transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GlobeMesh({
  destinations,
  active,
  onSelect,
}: {
  destinations: Destination[];
  active: Destination;
  onSelect: (dest: Destination) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  const points = useMemo(
    () => destinations.map((d) => ({ dest: d, pos: toVector3(d.coords[0], d.coords[1], RADIUS) })),
    [destinations]
  );

  const arcs = useMemo(() => {
    const segments: { start: THREE.Vector3; end: THREE.Vector3; mid: THREE.Vector3 }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i].pos;
      const end = points[i + 1].pos;
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS * 1.35);
      segments.push({ start, end, mid });
    }
    return segments;
  }, [points]);

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshBasicMaterial color="#0a1628" transparent opacity={0.92} />
      </mesh>
      <mesh>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <meshBasicMaterial color="#3a6ea5" wireframe transparent opacity={0.18} />
      </mesh>
      {arcs.map((arc, i) => (
        <QuadraticBezierLine
          key={i}
          start={arc.start}
          end={arc.end}
          mid={arc.mid}
          color={active.theme.accent}
          lineWidth={1.5}
          transparent
          opacity={0.55}
        />
      ))}
      {points.map(({ dest, pos }) => (
        <Pin key={dest.id} dest={dest} position={pos} isActive={dest.id === active.id} onSelect={onSelect} />
      ))}
    </group>
  );
}

export function Globe({
  destinations,
  active,
  onSelect,
  className,
}: {
  destinations: Destination[];
  active: Destination;
  onSelect: (dest: Destination) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={1.2} />
        <GlobeMesh destinations={destinations} active={active} onSelect={onSelect} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
        />
      </Canvas>
    </div>
  );
}
