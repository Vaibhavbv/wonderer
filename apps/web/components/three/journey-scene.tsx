"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import type { Destination, Vehicle } from "@/lib/journey-data";

const R = 2;
const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

/** Anything with a `.get()` — a MotionValue or a derived reader. */
interface ProgressSource {
  get(): number;
}

// Frame-loop scratch objects: useFrame runs single-threaded, so these are
// safely shared. Allocating them per frame (60×/s each) is pure GC pressure.
const _pos = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3();
const _side = new THREE.Vector3();
const _realUp = new THREE.Vector3();
const _turn = new THREE.Vector3();
const _surf = new THREE.Vector3();
const _trailP = new THREE.Vector3();
const _lift = new THREE.Vector3();
const _basis = new THREE.Matrix4();

function toVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** One arc-length-parameterized curve chaining every leg of the journey. */
function buildRoute(destinations: Destination[]): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < destinations.length - 1; i++) {
    const a = toVector3(...destinations[i].coords, R * 1.005);
    const b = toVector3(...destinations[i + 1].coords, R * 1.005);
    // Arc height scales with leg length: neighbouring cities get a gentle
    // hop, ocean crossings get a high, dramatic arc.
    const lift = 1.01 + Math.min(0.32, a.distanceTo(b) * 0.14);
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * lift);
    path.add(new THREE.QuadraticBezierCurve3(a, mid, b));
  }
  return path;
}

/* ------------------------------------------------------------------ */
/* Globe: night sphere + city lights + atmosphere + drifting clouds    */
/* ------------------------------------------------------------------ */

const ATMOSPHERE_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(uColor, 1.0) * intensity * 0.85;
  }
`;

const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = vUv * vec2(7.0, 3.5);
    float n = fbm(uv + vec2(uTime * 0.012, uTime * 0.004));
    float cloud = smoothstep(0.58, 0.9, n);
    float pole = smoothstep(0.02, 0.2, vUv.y) * smoothstep(0.98, 0.8, vUv.y);
    gl_FragColor = vec4(vec3(0.72, 0.82, 1.0), cloud * pole * 0.13);
  }
`;

function Globe({ coarse }: { coarse: boolean }) {
  const cloudRef = useRef<THREE.Mesh>(null);
  const cloudMat = useRef<THREE.ShaderMaterial>(null);

  const cityLights = useMemo(() => {
    const count = coarse ? 700 : 1600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Cluster lights: pick a "city center", scatter a few points near it.
      const v = new THREE.Vector3().randomDirection();
      v.y *= 0.82; // fewer lights near the poles, like Earth
      v.normalize().multiplyScalar(R * 1.002);
      pos.set([v.x, v.y, v.z], i * 3);
      c.setHSL(0.09 + Math.random() * 0.04, 0.7, 0.45 + Math.random() * 0.4);
      col.set([c.r, c.g, c.b], i * 3);
    }
    return { pos, col };
  }, [coarse]);

  useFrame((state, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.008;
    if (cloudMat.current) cloudMat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group>
      {/* Night-side planet */}
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial color="#0a1424" roughness={1} metalness={0} />
      </mesh>
      {/* Faint latitude/longitude scaffolding */}
      <mesh>
        <sphereGeometry args={[R * 1.0005, 48, 48]} />
        <meshBasicMaterial color="#2b4d78" wireframe transparent opacity={0.05} />
      </mesh>
      {/* Glowing city lights */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cityLights.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[cityLights.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.014} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} toneMapped={false} />
      </points>
      {/* Moving cloud shell */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[R * 1.02, 48, 48]} />
        <shaderMaterial
          ref={cloudMat}
          vertexShader={CLOUD_VERT}
          fragmentShader={CLOUD_FRAG}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
        />
      </mesh>
      {/* Atmosphere halo */}
      <mesh scale={1.18}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERT}
          fragmentShader={ATMOSPHERE_FRAG}
          uniforms={{ uColor: { value: new THREE.Color("#3d6fd6") } }}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Route: faint full path + glowing tube that draws itself on scroll   */
/* ------------------------------------------------------------------ */

function Route({
  curve,
  progress,
  accent,
}: {
  curve: THREE.CurvePath<THREE.Vector3>;
  progress: ProgressSource;
  accent: string;
}) {
  const drawnRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const SEGMENTS = 480;
  const indexCount = useMemo(() => SEGMENTS * 6 * 6, []); // tubularSegments * radialSegments * 6
  // Lerp target reallocates only when the leg's accent changes, not per frame.
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((_, delta) => {
    const t = THREE.MathUtils.clamp(progress.get(), 0, 1);
    if (drawnRef.current) {
      // Draw the tube progressively — earlier legs stay softly lit.
      drawnRef.current.geometry.setDrawRange(0, Math.floor(indexCount * t));
    }
    if (matRef.current) matRef.current.color.lerp(accentColor, Math.min(1, delta * 3));
  });

  return (
    <group>
      {/* the untraveled route, barely-there */}
      <mesh>
        <tubeGeometry args={[curve, SEGMENTS, 0.004, 6, false]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {/* the glowing, drawn trail */}
      <mesh ref={drawnRef}>
        <tubeGeometry args={[curve, SEGMENTS, 0.009, 6, false]} />
        <meshBasicMaterial ref={matRef} color={accent} toneMapped={false} transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Vehicle: tiny 3D craft that rides the route, banks, leaves a trail  */
/* ------------------------------------------------------------------ */

function VehicleMesh({ kind, accent }: { kind: Vehicle; accent: string }) {
  const emissive = { color: accent, toneMapped: false } as const;
  if (kind === "plane" || kind === "balloon") {
    return (
      <group>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.022, 0.085, 10]} />
          <meshBasicMaterial {...emissive} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.028, 0.005, 0.1]} />
          <meshBasicMaterial {...emissive} />
        </mesh>
        <mesh position={[-0.035, 0.014, 0]}>
          <boxGeometry args={[0.012, 0.024, 0.005]} />
          <meshBasicMaterial {...emissive} />
        </mesh>
      </group>
    );
  }
  if (kind === "train") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.09, 0.028, 0.028]} />
          <meshBasicMaterial {...emissive} />
        </mesh>
        <mesh position={[0.052, 0.006, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.024]} />
          <meshBasicMaterial {...emissive} />
        </mesh>
      </group>
    );
  }
  // van / jeep / motorcycle — a little glowing rover
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.06, 0.022, 0.032]} />
        <meshBasicMaterial {...emissive} />
      </mesh>
      <mesh position={[-0.008, 0.018, 0]}>
        <boxGeometry args={[0.03, 0.016, 0.028]} />
        <meshBasicMaterial {...emissive} />
      </mesh>
    </group>
  );
}

const TRAIL_LEN = 48;

function TravelVehicle({
  curve,
  progress,
  legSeg,
  destinations,
  accent,
}: {
  curve: THREE.CurvePath<THREE.Vector3>;
  progress: ProgressSource;
  /** Index of the journey leg currently being travelled. */
  legSeg: ProgressSource;
  destinations: Destination[];
  accent: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const trailGeo = useRef<THREE.BufferGeometry>(null);
  const [kind, setKind] = useState<Vehicle>(destinations[0]?.vehicle ?? "plane");
  const smoothT = useRef(0);
  const prevTangent = useRef(new THREE.Vector3(1, 0, 0));

  const trail = useMemo(() => {
    const positions = new Float32Array(TRAIL_LEN * 3);
    const colors = new Float32Array(TRAIL_LEN * 3);
    return { positions, colors };
  }, []);

  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((state, delta) => {
    const raw = THREE.MathUtils.clamp(progress.get(), 0, 1);
    // realistic easing: the vehicle glides toward the scroll target
    smoothT.current = THREE.MathUtils.damp(smoothT.current, raw, 4.5, delta);
    const t = THREE.MathUtils.clamp(smoothT.current, 0.0001, 0.9999);

    const pos = curve.getPointAt(t, _pos);
    const tangent = curve.getTangentAt(t, _tangent).normalize();
    const up = _up.copy(pos).normalize();

    const g = groupRef.current;
    if (g) {
      g.position.copy(pos).addScaledVector(up, 0.02);
      // orient: forward = tangent, up = away from the planet
      const side = _side.crossVectors(up, tangent).normalize();
      const realUp = _realUp.crossVectors(tangent, side).normalize();
      _basis.makeBasis(tangent, realUp.negate(), side);
      g.quaternion.setFromRotationMatrix(_basis);
      // bank into turns
      const turn = _turn.subVectors(tangent, prevTangent.current);
      const bank = THREE.MathUtils.clamp(turn.dot(side) * -30, -0.5, 0.5);
      g.rotateOnWorldAxis(tangent, bank);
      prevTangent.current.copy(tangent);
      // gentle bob
      g.position.addScaledVector(up, Math.sin(state.clock.elapsedTime * 2.2) * 0.004);
    }

    // soft shadow hugging the surface below the craft
    if (shadowRef.current) {
      _surf.copy(pos).normalize().multiplyScalar(R * 1.004);
      shadowRef.current.position.copy(_surf);
      shadowRef.current.lookAt(0, 0, 0);
    }

    // glowing particle trail — a ring buffer trailing behind the craft
    const geo = trailGeo.current;
    if (geo) {
      const { positions, colors } = trail;
      const c = accentColor;
      for (let i = 0; i < TRAIL_LEN; i++) {
        const back = t - (i / TRAIL_LEN) * 0.02;
        const p = curve.getPointAt(THREE.MathUtils.clamp(back, 0.0001, 0.9999), _trailP);
        const lift = _lift.copy(p).normalize().multiplyScalar(0.02);
        const j = i * 3;
        positions[j] = p.x + lift.x;
        positions[j + 1] = p.y + lift.y;
        positions[j + 2] = p.z + lift.z;
        const fade = EASE_OUT(1 - i / TRAIL_LEN);
        colors[j] = c.r * fade;
        colors[j + 1] = c.g * fade;
        colors[j + 2] = c.b * fade;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }

    // swap the craft as the journey's leg changes
    const seg = Math.min(destinations.length - 1, legSeg.get() + 1);
    const next = destinations[seg]?.vehicle;
    if (next && next !== kind) setKind(next);
  });

  return (
    <group>
      <group ref={groupRef}>
        <VehicleMesh kind={kind} accent={accent} />
        <pointLight color={accent} intensity={0.6} distance={0.5} />
      </group>
      <mesh ref={shadowRef}>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <points>
        <bufferGeometry ref={trailGeo}>
          <bufferAttribute attach="attributes-position" args={[trail.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[trail.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Mood particles: fireflies / dust / weather tinted per destination   */
/* ------------------------------------------------------------------ */

function MoodParticles({
  accent,
  variant,
  coarse,
  pointer,
}: {
  accent: string;
  variant: Destination["theme"]["particle"];
  coarse: boolean;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const count = coarse ? 140 : 320;

  const seeds = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 + 1;
      speed[i] = 0.3 + Math.random() * 0.7;
    }
    return { pos, speed };
  }, [count]);

  const falling = variant === "snow" || variant === "petals" || variant === "leaves";
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds.speed[i];
      if (falling) {
        arr[i * 3 + 1] -= delta * s * 0.35;
        arr[i * 3] += Math.sin(time * s + i) * delta * 0.12; // flutter
        if (arr[i * 3 + 1] < -4) arr[i * 3 + 1] = 4;
      } else {
        arr[i * 3 + 1] += Math.sin(time * 0.4 * s + i) * delta * 0.05;
        arr[i * 3] += delta * s * 0.03;
        if (arr[i * 3] > 6) arr[i * 3] = -6;
      }
    }
    pts.geometry.attributes.position.needsUpdate = true;
    // particles lean away from the cursor
    pts.rotation.y = THREE.MathUtils.damp(pts.rotation.y, pointer.current.x * 0.12, 2, delta);
    pts.rotation.x = THREE.MathUtils.damp(pts.rotation.x, pointer.current.y * 0.08, 2, delta);
    // tint drifts toward the destination's mood
    if (matRef.current) matRef.current.color.lerp(accentColor, Math.min(1, delta * 1.5));
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[seeds.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color={accent}
        size={0.035}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Nebula: big soft glows floating far behind the planet               */
/* ------------------------------------------------------------------ */

function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function Nebula() {
  const tex = useGlowTexture();
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.004;
  });
  return (
    <group ref={group}>
      <sprite position={[-5, 2.5, -9]} scale={[11, 11, 1]}>
        <spriteMaterial map={tex} color="#4a3a8a" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[6, -2, -10]} scale={[13, 13, 1]}>
        <spriteMaterial map={tex} color="#1e4a6e" transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[1, 4, -12]} scale={[9, 9, 1]}>
        <spriteMaterial map={tex} color="#6e2a4a" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera rig: cinematic fly-throughs that chase the route             */
/* ------------------------------------------------------------------ */

function CameraRig({
  curve,
  progress,
  legFrac,
  destinations,
  pointer,
  speedRef,
}: {
  curve: THREE.CurvePath<THREE.Vector3>;
  progress: ProgressSource;
  /** 0→1 position within the current leg (0 = parked at a stop). */
  legFrac: ProgressSource;
  destinations: Destination[];
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  speedRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const dir = useRef(new THREE.Vector3(0, 0, 1));
  const dist = useRef(5.4);
  const look = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const t = THREE.MathUtils.clamp(progress.get(), 0.0001, 0.9999);
    const focus = curve.getPointAt(t);

    // camera hangs off the route point's radial direction — it flies
    // around the planet as the vehicle travels
    const targetDir = focus.clone().normalize();
    dir.current.lerp(targetDir, 1 - Math.exp(-2.2 * delta)).normalize();

    // breathe out mid-leg, breathe in at each stop
    const segFrac = legFrac.get();
    const targetDist = 4.7 + Math.sin(segFrac * Math.PI) * 1.1;
    dist.current = THREE.MathUtils.damp(dist.current, targetDist, 2.2, delta);

    const base = dir.current.clone().multiplyScalar(dist.current);
    // parallax: the world shifts slightly against the cursor
    const camRight = new THREE.Vector3().crossVectors(camera.up, dir.current).normalize();
    const camUp = new THREE.Vector3().crossVectors(dir.current, camRight).normalize();
    base.addScaledVector(camRight, pointer.current.x * 0.22);
    base.addScaledVector(camUp, pointer.current.y * 0.16);

    camera.position.copy(base);
    look.current.lerp(focus.clone().multiplyScalar(0.55), 1 - Math.exp(-3 * delta));
    camera.lookAt(look.current);

    // report camera speed so post-processing can add travel blur
    speedRef.current = lastPos.current.distanceTo(camera.position) / Math.max(delta, 1e-4);
    lastPos.current.copy(camera.position);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Post-processing: bloom + vignette + speed-reactive aberration       */
/* ------------------------------------------------------------------ */

function Post({ speedRef, coarse }: { speedRef: React.MutableRefObject<number>; coarse: boolean }) {
  // Built imperatively (not via the JSX wrapper) because the wrapper
  // JSON.stringify's its props for memoization — passing a ref there is a
  // circular-structure crash under React 19, where ref is a plain prop.
  const chroma = useMemo(
    () =>
      new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.0004, 0.0004),
        radialModulation: false,
        modulationOffset: 0,
      }),
    []
  );
  useFrame((_, delta) => {
    // subtle chromatic fringing that swells during camera travel — a
    // cheap, tasteful stand-in for motion blur
    const target = Math.min(0.0022, 0.0004 + speedRef.current * 0.0009);
    const next = THREE.MathUtils.damp(chroma.offset.x, target, 3, delta);
    chroma.offset.set(next, next);
  });
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={coarse ? 0.5 : 0.75} luminanceThreshold={0.22} mipmapBlur radius={0.72} />
      <primitive object={chroma} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
      <Noise premultiply opacity={0.05} />
    </EffectComposer>
  );
}

/* ------------------------------------------------------------------ */
/* Scene root                                                          */
/* ------------------------------------------------------------------ */

function SceneContents({
  destinations,
  progress,
  active,
  coarse,
}: {
  destinations: Destination[];
  progress: MotionValue<number>;
  active: Destination;
  coarse: boolean;
}) {
  const curve = useMemo(() => buildRoute(destinations), [destinations]);
  const pointer = useRef({ x: 0, y: 0 });
  const speedRef = useRef(0);
  // The journey scroll dwells on destination i at v=(i+0.5)/n, but the legs
  // have wildly different lengths (Delhi→Rishikesh vs Goa→Kyoto), so map the
  // scroll piecewise onto each stop's cumulative arc-length fraction — the
  // drawn trail then lands exactly on a stop while its photo is on screen.
  const nav = useMemo(() => {
    const lens = curve.getCurveLengths();
    const total = lens[lens.length - 1] || 1;
    const stops = [0, ...lens.map((l) => l / total)];
    const n = destinations.length;
    const legs = Math.max(1, n - 1);
    const read = () => {
      const x = THREE.MathUtils.clamp((progress.get() * n - 0.5) / Math.max(1, n - 1), 0, 1);
      const seg = Math.min(legs - 1, Math.floor(x * legs));
      const frac = x * legs - seg;
      return { seg, frac, t: stops[seg] + frac * ((stops[seg + 1] ?? 1) - stops[seg]) };
    };
    return {
      t: { get: () => read().t } as ProgressSource,
      frac: { get: () => read().frac } as ProgressSource,
      seg: { get: () => read().seg } as ProgressSource,
    };
  }, [curve, progress, destinations.length]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-6, 3, 4]} intensity={1.1} color="#8fb4ff" />
      <Stars radius={26} depth={22} count={coarse ? 1400 : 3200} factor={3} saturation={0.15} fade speed={0.4} />
      <Nebula />
      <Globe coarse={coarse} />
      {destinations.length > 1 && (
        <>
          <Route curve={curve} progress={nav.t} accent={active.theme.accent} />
          <TravelVehicle curve={curve} progress={nav.t} legSeg={nav.seg} destinations={destinations} accent={active.theme.accent} />
        </>
      )}
      <MoodParticles accent={active.theme.accent} variant={active.theme.particle} coarse={coarse} pointer={pointer} />
      <CameraRig curve={curve} progress={nav.t} legFrac={nav.frac} destinations={destinations} pointer={pointer} speedRef={speedRef} />
      <Post speedRef={speedRef} coarse={coarse} />
    </>
  );
}

export function JourneyScene({
  destinations,
  progress,
  active,
}: {
  destinations: Destination[];
  /** 0→1 scroll progress across the whole journey (spring-smoothed). */
  progress: MotionValue<number>;
  active: Destination;
}) {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    setCoarse(window.innerWidth < 768 || navigator.hardwareConcurrency <= 4);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, coarse ? 1.25 : 1.75]}
        camera={{ position: [0, 0, 5.4], fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
        style={{ background: "#02040a" }}
      >
        <SceneContents destinations={destinations} progress={progress} active={active} coarse={coarse} />
      </Canvas>
    </div>
  );
}
