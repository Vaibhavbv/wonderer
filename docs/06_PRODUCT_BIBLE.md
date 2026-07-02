# 06 — Product Bible

> The soul of Wanderverse. [`04_CODING_STANDARDS.md`](./04_CODING_STANDARDS.md) governs *how code is written*; this governs *how the product must feel*. When a technical choice and a feeling conflict, and the user hasn't said otherwise, **protect the feeling.** Primary source: [`MASTERPLAN.md`](./MASTERPLAN.md) and [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## Core philosophy

**Wanderverse makes remembering a trip feel as good as taking it.**

It is not photo storage. It is not a trip planner. It is a place where your travel life becomes a beautiful, living, shareable thing — and where watching someone else's journey makes you want to take your own. The product's job is to make ordinary photos feel cinematic and to make every traveler look like the hero of their own film.

**The one-line test for any screen:** *If it doesn't make a digital nomad want to screenshot it and post it, redo it.*

---

## Design principles

1. **Editorial, not app-y.** Think a beautifully art-directed travel magazine, not a dashboard. Large serif headlines, full-bleed photography, generous whitespace. Let content breathe.
2. **One accent, and it glows.** **Sunset Coral `#FF5A4D`** is the *only* chromatic accent — used for the mascot, the route line, and primary CTAs. Everything else is black / white / paper so the coral is the single thing that draws the eye. **Never introduce a second accent.**
3. **Photography is the hero.** UI recedes; images dominate. Chrome is minimal, quiet, and gets out of the way.
4. **Type as identity.** Serif (Playfair Display) for headlines = editorial soul; sans (Inter) for body/UI = clarity. Don't break this pairing.
5. **Motion is meaning, not decoration.** Every animation should express *journey, distance, arrival, memory*. If a motion doesn't mean something, cut it.
6. **Depth over flatness — but earned.** The 3D globe and parallax exist to convey *place* and *travel*, not to show off. Performance and legibility come first.
7. **Air and restraint.** When in doubt, remove. Whitespace is a feature.
8. **Every screen is a show-off screen.** Especially the profile. Users are pouring their travel identity in; reward them by making it look incredible.

---

## Motion philosophy

Motion is the product's signature and its hardest-won asset (`journey-scene.tsx`). Rules:

- **Cinematic easing, never linear.** Use the tuned eases (`--ease-premium/elastic/snap` in `globals.css`); movement should feel weighted and intentional, like a camera, not a CSS transition.
- **Scroll drives the story.** Scroll = travelling forward through the journey. Progress is spatial: the route draws, the vehicle advances, the globe turns, photos arrive.
- **Continuity.** Elements enter and leave with purpose (crossfades, mask reveals via `TextReveal`, shared-layout transitions in `DiscoverGallery`). Nothing pops or jumps.
- **Restraint at rest.** When the user isn't interacting, the scene is calm — a slow drift, not a busy loop.
- **Never at the cost of frames.** 60fps desktop, graceful degradation on mobile (`coarse` mode). Jank breaks the spell worse than no animation.
- **Reduced motion is first-class.** `prefers-reduced-motion` gets a real, dignified experience (2D `ParticleField` + `RouteVehicle`), not a broken one.
- **Tools:** Framer Motion + React Three Fiber + Lenis (smooth scroll). *Not* GSAP (present but unused — don't reach for it).

---

## User experience goals

- **Effortless awe.** The user does little; the product makes their trip look epic. Uploading photos should feel like handing them to a film editor.
- **Instant legibility.** However cinematic, the user always knows where they are, what they're looking at, and what to do next.
- **Pride and shareability.** Every output (profile, trip, recap) is something the user *wants* to show off. Shareability is the growth engine, so it is a UX requirement, not a nice-to-have.
- **Calm, not cluttered.** Few choices per screen, each beautiful.
- **Fast where it counts.** Perceived performance (skeletons, optimistic UI, streamed content) protects the magic.

---

## Storytelling principles

- **A trip is a narrative with a shape:** departure → journey → destinations → arrival → reflection. The Wander View expresses this literally.
- **The map/globe is the spine** of every story — location is what makes travel content travel content. Geography is never incidental.
- **The mascot vehicle carries the story.** A small illustrated coral craft flies the route, trailing a dotted contrail, and **morphs to the mode of each leg** (plane for flights, camper van for road trips, train, ferry — same illustrated family, same coral). Default brand icon = the plane.
- **Photos are memories, placed in space and time**, not a grid. They surface where and when they happened.
- **The profile is the meta-story:** one continuous route line that grows trip-by-trip in date order — a life, mapped. "Replay" flies the user's *entire* travel history.
- **Let the user's content be the hero;** the system's voice (AI copy, chrome) is a supporting narrator, never the star.

---

## How scrolling should feel

- **Like gliding forward through a journey**, with inertia — smooth, weighted, slightly cinematic (Lenis). Not native-jerky, not sea-sick-slow.
- **Scroll = progress along the route.** As you scroll, the vehicle advances, the route draws, the active destination changes, its giant title and card arrive, the background photo crossfades.
- **The globe responds to scroll,** turning/flying to keep the active leg framed (the `CameraRig`).
- **Predictable and reversible.** Scrolling back rewinds the story cleanly. An itinerary rail shows where you are and lets you jump.
- **Snappy on mobile,** with sensible touch behavior; never fighting the OS.

---

## How animations should feel

- **Weighted, warm, alive** — coral and light, never cold or techy. This is a travel product, not a sci-fi console.
- **Purposeful:** entrances reveal, transitions carry meaning, the vehicle banks into turns because that's how travel feels.
- **Layered depth:** background (globe/sky) < route line < photo cards < text < mascot, moving at parallax-appropriate rates.
- **Post-processing is seasoning, not the meal:** bloom/vignette/subtle chromatic aberration deepen the cinematic feel; they must never smear legibility or tank performance.
- **Micro-interactions delight quietly:** the custom cursor, magnetic buttons, tilt cards, sheen on glass — small, tasteful, never gimmicky.

---

## How the globe should behave

- **A living planet, at rest.** Slow idle rotation, night-side city lights, atmosphere halo, drifting stars/nebula — beautiful when untouched.
- **Purposeful when scrolling.** It flies/turns to frame the active destination and the current leg of the route; the camera moves like a director's crane, not a game camera.
- **The route is drawn *on* it,** arc-length-parameterized so the vehicle rides a smooth path and the line "draws on" with scroll progress.
- **Legible over pretty when they conflict** — the active destination and its info must always be readable against the globe.
- **Degrades gracefully:** `coarse` mode for low-power devices; a dignified 2D fallback for reduced-motion. It should never be the reason a device chugs.
- **It is a storytelling device, not a GIS tool.** Accuracy serves emotion here; we're not building a mapping product.

---

## How users should emotionally feel while using Wanderverse

The target emotional arc, in order of importance:

1. **Proud** — "*My* travel life looks incredible. I want to show this."
2. **Nostalgic / moved** — "I remember this. I feel that trip again."
3. **Inspired / itchy-footed** — "I want to go *there*." (This feeling, aimed at *other people's* trips, is the growth loop.)
4. **Calm and unhurried** — the opposite of a noisy social feed; a place to linger.
5. **Delighted** — small moments of "oh, that's lovely" from the motion and craft.
6. **In control** — beautiful never means confusing; privacy and ownership always feel respected.

Feelings to **avoid**: overwhelmed, generic, "just another app," anxious, cold, or that the tech is showing off at the content's expense.

---

## The brand in one paragraph (for quick recall)

Wanderverse is a bright, editorial travel-social network. Sunset Coral `#FF5A4D` is the only accent, glowing against black/white/paper. Playfair serif headlines over Inter body, full-bleed photography, lots of air. A small coral vehicle — plane by default, morphing per leg — flies your route across a living 3D globe as you scroll a cinematic story. Your profile is your travel life, mapped as one growing route. Every screen exists to make a traveler proud enough to share it — and that sharing is how the next traveler arrives.

*Design law: light map, one coral accent, serif headlines, full-bleed photos, lots of air. If a screen doesn't make a nomad want to screenshot it, redo it.*
