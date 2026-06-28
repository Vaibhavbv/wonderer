"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { journey } from "@/lib/journey-data";
import { JourneyNav } from "./journey-nav";
import { DestinationCard } from "./destination-card";

const ease = [0.16, 1, 0.3, 1] as const;
const smooth = (t: number) => t * t * (3 - 2 * t); // smoothstep

// Build a densified path (great-circle-ish straight lerps) through all stops
// so we can reveal the route progressively and place the vehicle on it.
function buildPath(points: [number, number][], per = 60): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    for (let s = 0; s < per; s++) {
      const f = s / per;
      out.push([ax + (bx - ax) * f, ay + (by - ay) * f]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

export function MapJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const coords = journey.map((d) => d.coord);
  const pathRef = useRef(buildPath(coords));

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Initialise Mapbox once, client-side only.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      if (cancelled || !mapNodeRef.current) return;

      const first = journey[0];
      const map = new mapboxgl.Map({
        container: mapNodeRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: first.coord,
        zoom: first.camera.zoom,
        pitch: first.camera.pitch,
        bearing: first.camera.bearing,
        projection: "globe",
        antialias: true,
        attributionControl: false,
        interactive: false,
      });
      mapRef.current = map;

      // Never let the page get stuck on the loading veil — reveal after a
      // few seconds even if a tile/style call is slow or fails.
      const veilTimer = setTimeout(() => setLoaded(true), 6000);
      map.on("error", (e: any) => {
        // eslint-disable-next-line no-console
        console.warn("[map] ", e?.error?.message || e);
      });

      map.on("style.load", () => {
        clearTimeout(veilTimer);
        // 3D terrain
        map.addSource("dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: "dem", exaggeration: 1.4 });

        // Cinematic atmosphere
        map.setFog({
          color: "rgb(186, 210, 235)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.18,
          "space-color": "rgb(8, 12, 26)",
          "star-intensity": 0.5,
        });

        // Full faint route + the glowing drawn portion + endpoint markers
        map.addSource("route-full", {
          type: "geojson",
          data: lineFeature(pathRef.current),
        });
        map.addLayer({
          id: "route-full",
          type: "line",
          source: "route-full",
          paint: {
            "line-color": "#ffffff",
            "line-opacity": 0.25,
            "line-width": 2,
            "line-dasharray": [1, 3],
          },
        });
        map.addSource("route-done", {
          type: "geojson",
          data: lineFeature([coords[0]]),
        });
        map.addLayer({
          id: "route-done",
          type: "line",
          source: "route-done",
          paint: {
            "line-color": first.theme.accent,
            "line-width": 4,
            "line-blur": 1,
          },
        });
        map.addSource("vehicle", { type: "geojson", data: pointFeature(coords[0]) });
        map.addLayer({
          id: "vehicle",
          type: "circle",
          source: "vehicle",
          paint: {
            "circle-radius": 7,
            "circle-color": first.theme.accent,
            "circle-stroke-width": 3,
            "circle-stroke-color": "rgba(255,255,255,0.7)",
          },
        });

        // Pins for every destination
        map.addSource("stops", {
          type: "geojson",
          data: { type: "FeatureCollection", features: coords.map((c) => pointFeature(c)) },
        });
        map.addLayer({
          id: "stops",
          type: "circle",
          source: "stops",
          paint: {
            "circle-radius": 4,
            "circle-color": "rgba(255,255,255,0.9)",
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(0,0,0,0.4)",
          },
        });

        readyRef.current = true;
        setLoaded(true);
        applyScroll(scrollYProgress.get());
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyScroll(p: number) {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const n = journey.length;
    const t = Math.min(0.9999, Math.max(0, p));
    const seg = t * (n - 1);
    const i = Math.floor(seg);
    const f = smooth(seg - i);
    const a = journey[i];
    const b = journey[Math.min(n - 1, i + 1)];

    const lng = a.coord[0] + (b.coord[0] - a.coord[0]) * f;
    const lat = a.coord[1] + (b.coord[1] - a.coord[1]) * f;
    // Pull the camera up/out mid-flight, settle in on arrival — a cinematic arc.
    const arc = Math.sin(Math.PI * f) * 2.2;
    const zoom = a.camera.zoom + (b.camera.zoom - a.camera.zoom) * f - arc;
    const pitch = a.camera.pitch + (b.camera.pitch - a.camera.pitch) * f;
    const bearing = a.camera.bearing + (b.camera.bearing - a.camera.bearing) * f;
    map.jumpTo({ center: [lng, lat], zoom, pitch, bearing });

    // Reveal route + move vehicle
    const path = pathRef.current;
    const idx = Math.min(path.length - 1, Math.floor(t * (path.length - 1)));
    const done = path.slice(0, idx + 1);
    (map.getSource("route-done") as any)?.setData(lineFeature(done.length ? done : [path[0]]));
    (map.getSource("vehicle") as any)?.setData(pointFeature(path[idx]));

    const cur = Math.round(seg);
    if (cur !== active) {
      setActive(cur);
      const accent = journey[cur].theme.accent;
      map.setPaintProperty("route-done", "line-color", accent);
      map.setPaintProperty("vehicle", "circle-color", accent);
    }
  }

  useMotionValueEvent(scrollYProgress, "change", applyScroll);

  const dest = journey[active];

  return (
    <div ref={containerRef} style={{ height: `${journey.length * 100}vh` }} className="relative bg-[#0a0e1a]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* The live 3D map */}
        <div ref={mapNodeRef} className="absolute inset-0" />

        {/* Loading veil */}
        <AnimatePresence>
          {!loaded && (
            <motion.div
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0e1a]"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                <p className="font-heading text-2xl text-white/80">Preparing your journey…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic theme tint + vignette over the map */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={dest.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease }}
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${dest.theme.from}33 0%, transparent 30%, transparent 55%, ${dest.theme.to}dd 100%)`,
            }}
          />
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.5)_100%)]" />

        {/* Giant place name */}
        <div className="pointer-events-none absolute inset-x-0 top-[16%] flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
              transition={{ duration: 0.9, ease }}
              className="px-6 text-center"
            >
              <p className="mb-2 text-xs sm:text-sm uppercase tracking-[0.35em] text-white/70">{dest.country}</p>
              <h2 className="font-heading text-6xl sm:text-8xl lg:text-[8.5rem] leading-[0.9] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
                {dest.name}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating glass destination card */}
        <div className="absolute bottom-8 right-4 sm:right-10 z-20">
          <AnimatePresence mode="wait">
            <DestinationCard key={dest.id} dest={dest} />
          </AnimatePresence>
        </div>

        {/* Itinerary rail */}
        <div className="absolute left-4 sm:left-10 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
          {journey.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3">
              <div
                className="h-px transition-all duration-500"
                style={{
                  width: i === active ? 30 : 12,
                  background: i === active ? dest.theme.accent : "rgba(255,255,255,0.35)",
                }}
              />
              <span
                className="text-xs transition-all duration-500"
                style={{ color: i === active ? "#fff" : "rgba(255,255,255,0.45)" }}
              >
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <JourneyNav accent={dest.theme.accent} />
      <ScrollCue />
    </div>
  );
}

function lineFeature(coords: [number, number][]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates: coords },
  };
}
function pointFeature(coord: [number, number]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Point" as const, coordinates: coord },
  };
}

function ScrollCue() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.div
      animate={{ opacity: hidden ? 0 : 1 }}
      className="fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 text-white/70"
    >
      <span className="text-xs uppercase tracking-[0.25em]">Scroll to travel</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-8 w-px bg-gradient-to-b from-white/70 to-transparent"
      />
    </motion.div>
  );
}
