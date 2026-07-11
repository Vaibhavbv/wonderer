# 18 — Performance Guide

> Current performance posture, bottlenecks, optimization strategy, and Three.js-specific guidance (the app's hardest performance surface). Targets come from the PRD's non-functional requirements.

---

## PRD performance targets (the bar)
- TTI < 2s on 4G · map/scene load < 500ms visible · 60fps desktop, ≥30fps mobile for the scroll experience · 60fps story editor with 100+ items · resumable uploads at 100 concurrent · 95% tile cache hit at scale.

---

## Current performance posture (Phase 0)

**Good foundations already in place:**
- **Server-first data fetching** — data-heavy pages are async Server Components (less client JS).
- **Envelope + Prisma `select`** — services fetch only needed fields.
- **Cursor pagination** on all list endpoints.
- **Smart caching split** — public reads `revalidate: 30`; private reads `no-store`.
- **WebGL isolation** — `journey-scene` is dynamically imported `ssr:false`; it never runs on the server.
- **`coarse` performance mode** in `journey-scene` for low-power/mobile (≤4 cores).
- **Reduced-motion fallback** — 2D path avoids WebGL entirely when requested.
- **`optimizePackageImports`** for `lucide-react`, `framer-motion`, `@react-three/drei`.
- **Browser-direct S3 upload** — media bytes bypass the API.
- **BullMQ async** for slow AI work.

**Not yet measured:** no perf budgets, Lighthouse CI, bundle analysis, or runtime metrics exist. Numbers above are targets, not verified results.

---

## Potential bottlenecks (ranked)

1. **The WebGL journey scene (`journey-scene.tsx`)** — the single biggest cost. ~700 lines: globe shaders, route tube, particle trails, post-fx (Bloom/Vignette/Noise/ChromaticAberration). Post-processing especially is GPU-heavy. Risk: frame drops on mid/low-end devices.
2. **Large media / raw `<img>`** — demo/detail pages use raw `<img>` and full-res images. At real scale (user photos) this hurts LCP and bandwidth badly (no responsive variants — `Media.variants` is unused).
3. **No CDN / tile caching** — `MapTileCache` is unused; media served straight from S3 originals.
4. **In-process BullMQ worker** — AI jobs compete with API request handling for CPU in the same process.
5. **Denormalized counters** keep reads cheap but add write cost + drift risk.
6. **Bundle size** — `three`, `@react-three/*`, `framer-motion` are large; keeping them out of shared/critical chunks matters.
7. **No rate limiting enforced** — `ThrottlerGuard` unused; a burst can overload the API/DB.
8. **`lat:0,lng:0` on locations** — not perf, but forces client-side workarounds and re-renders; real geocoding will change data shapes.

---

## Optimization strategy (by phase)

**Now / cheap wins (Phase 1):**
- Add **bundle analysis** + a Lighthouse pass to get real baselines.
- Ensure heavy libs stay in dynamically-imported/client-only chunks.
- Enforce rate limiting (WV-901) to protect the backend.
- Keep using `select` + pagination on any new endpoint.

**Media (Phase 9, WV-902):**
- Generate responsive **image variants/thumbnails** with `sharp` on upload; populate `Media.variants`.
- Migrate raw `<img>` for *real user media* to `next/image` (placeholders can stay raw).
- Put a **CDN** in front of S3; add lifecycle policies.

**Scale (Phase 9, WV-903):**
- **Split the BullMQ worker** into its own deployment.
- Add **observability** (metrics/tracing/logging) to find real hotspots before optimizing.
- Review DB **indexes** against real query patterns (schema is already reasonably indexed).
- Tile caching via `MapTileCache` (or a CDN) if/when 2D maps return.

**Golden rule:** **measure before optimizing.** No perf data exists yet — get baselines first; don't micro-optimize the WebGL scene on a hunch.

---

## Three.js / R3F performance rules (protect the signature)

`journey-scene.tsx` is tuned and fragile — respect these when touching it:

- **Never allocate in the render loop.** No `new Vector3()`/array/material creation inside `useFrame`; reuse cached objects.
- **Reuse geometries & materials;** share where possible; dispose on unmount.
- **Instance repeated meshes** (stars, particles, city lights) — don't create N separate meshes.
- **Respect `coarse` mode** — gate expensive effects (post-fx passes, particle counts, segment counts) behind it; add new cost there too.
- **Post-processing is the most expensive part** — adding passes tanks fps fast. Justify every pass; make heavy ones coarse-mode-off.
- **Keep the scene mounted only where used** — it's `ssr:false` + dynamically imported; don't leak it into pages that don't need it.
- **Cap pixel ratio** on high-DPI devices (`dpr` clamp) to avoid 4× fragment cost.
- **Prefer shader math over CPU work** for per-vertex/per-fragment effects.
- **Test on a throttled device** (or DevTools 4×/6× CPU throttle) before shipping scene changes; verify reduced-motion still bypasses WebGL.
- **Always import via `next/dynamic` `{ssr:false}`** — importing statically will crash SSR.

---

## Frontend general rules
- Server Components by default; minimize `"use client"` surface.
- `next/image` for new image work; lazy-load below-the-fold media.
- Debounce/throttle scroll/resize/pointer handlers; prefer `transform`/`opacity` for animation (composited).
- Keep global providers (`layout.tsx`) light — they run on every page.

## Backend general rules
- Paginate everything; `select` only needed fields; use indexed columns in `where`/`orderBy`.
- Maintain denormalized counters in the same transaction as the mutating write.
- Move slow/expensive work to BullMQ, not the request path.
- Cache expensive public reads (already done via `revalidate`); consider Redis caching for hot public queries at scale.

---

## Future Three.js considerations (Phases 3–5)
The roadmap adds heavy WebGL: the **profile life-map replay** (Phase 3) animates an entire travel history, and the **Trip Recap video export** (Phase 5) renders the scene to video. Both amplify the scene's cost:
- **Replay** must reuse the existing engine and honor `coarse`/reduced-motion; consider a simplified LOD for long histories.
- **Recap export** likely needs offscreen/headless rendering (server or worker) — plan for a separate, resource-bounded render pipeline, not the user's browser tab.
- Establish a **frame-time budget** and automated perf check before these land, so regressions are caught.
