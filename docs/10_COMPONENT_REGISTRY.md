# 10 — Component Registry

> Every meaningful frontend component: **purpose · key props · dependencies · reusable? · refactor notes.** Keep this current — when you add/change a component, update its row. Backend has no "components"; see [`11_API_REFERENCE.md`](./11_API_REFERENCE.md).

Legend: **Reusable** = designed to be dropped in elsewhere · **RSC** = React Server Component · **CC** = Client Component.

---

## `components/ui/` — Design-system primitives (reuse before building)

| Component | Purpose | Key props | Deps | Reusable | Refactor notes |
|---|---|---|---|---|---|
| `Button` (`button.tsx`) | The single button, `cva` variants (primary/secondary/outline/ghost/danger × xs–xl × fullWidth) + loading spinner | `variant`, `size`, `isLoading`, `fullWidth`, native button props | `cva`, `cn` | ✅ (RSC-safe) | Canonical. All new buttons use this. |
| `Card` (`card.tsx`) | Shadcn-style card set (`Card`/`Header`/`Title`/`Description`/`Content`/`Footer`) | standard | `cn` | ✅ (RSC-safe) | — |
| `CursorFX` (`cursor.tsx`) | Custom cursor: dot + spring ring + canvas particle trail | none (global) | Framer Motion, canvas | ✅ (global) | Fine-pointer + reduced-motion aware. Mounted in layout. |
| `GlowSurface` (`glow-surface.tsx`) | Writes `--mouse-x/y` for `.glow-surface` radial glow; polymorphic `as` | `as`, children | Framer Motion | ✅ | Used by Footer, CTASection. |
| `Magnetic` (`magnetic.tsx`) | Pulls child toward cursor (spring) | children, strength | Framer Motion | ✅ | Used in JourneyNav, CTASection. |
| `TextReveal` (`text-reveal.tsx`) | Word/char staggered mask reveal (+blur variant) | `text`/children, variant | Framer Motion | ✅ | Used across journey/CTA/discover. |
| `TiltCard` (`tilt-card.tsx`) | 3D perspective tilt on hover | children | Framer Motion | ✅ | Used in TripGrid, DiscoverGallery. |

---

## `components/layout/`

| Component | Purpose | Key props | Deps | Reusable | Refactor notes |
|---|---|---|---|---|---|
| `Navbar` (`navbar.tsx`) | Light sticky navbar, scroll-aware, mobile menu, Clerk buttons, notification bell, profile link | none | Clerk, `useMyUsername`, `NotificationBell` | ⚠ page-level | **Shares logic with `JourneyNav`** — consolidation candidate. |
| `Footer` (`footer.tsx`) | Dark footer, glow + particles | none | `GlowSurface`, `ParticleBackground` | ⚠ page-level | Contains **~10 dead links** (see 17_TECH_DEBT); social icons → `#`. |
| `NotificationBell` (`notification-bell.tsx`) | Notification dropdown, unread badge | `variant: "light"\|"dark"` | `useNotifications` | ✅ | API-backed, complete. |

---

## `components/three/` — WebGL (heavy; import with `ssr:false`)

| Component | Purpose | Key props | Deps | Reusable | Refactor notes |
|---|---|---|---|---|---|
| `JourneyScene` (`journey-scene.tsx`) | ⭐ The signature ~700-line WebGL scene: night globe (shader clouds/atmosphere/city lights), stars/nebula, arc-length route tube drawing on scroll, banking vehicle w/ trail + per-leg craft swap, cinematic CameraRig, post-fx (Bloom/Vignette/Noise/ChromaticAberration), `coarse` perf mode | `destinations`, scroll progress | R3F, drei, `@react-three/postprocessing`, `postprocessing` (⚠ transitive), three | ⚠ specialized | **Do NOT casually refactor.** Imports `postprocessing` transitively (WV-111). `toVector3` duplicated with `globe.tsx` (WV). |
| `Globe` (`globe.tsx`) | Simpler orbitable globe w/ pins + bezier arcs | `points`, handlers | R3F, drei | ✅ | Used by `DestinationsGlobe`. Shares `toVector3` w/ JourneyScene. |
| `ParticleBackground` (`particle-background.tsx`) | Drifting point cloud for dark sections | config | R3F | ✅ | Used by Footer, CTASection. |

---

## `components/journey/` — The scroll-journey experience

| Component | Purpose | Key props | Deps | Reusable | Refactor notes |
|---|---|---|---|---|---|
| `JourneyExperience` (`journey-experience.tsx`) | ⭐ Orchestrator: scroll progress, active-destination tracking, dynamic WebGL import, crossfade bg, giant title, floating card, itinerary rail, nav, scroll cue; **reduced-motion fallback** to 2D | `destinations?: Destination[]`, `cardHrefBase?` | Framer Motion, `next/dynamic`, journey/* | ✅ (data-agnostic) | Feed it demo data or real-trip data (`trip-to-journey`). High blast radius. |
| `DestinationsGlobe` (`destinations-globe.tsx`) | Interactive globe on `/destinations`; pin click → route | `destinations` | `Globe`, `ParticleBackground` | ✅ | — |
| `DestinationCard` (`destination-card.tsx`) | Glassmorphic tilt card w/ sheen | `destination`, `href?` | Framer Motion | ✅ | — |
| `JourneyNav` (`journey-nav.tsx`) | Dark floating pill nav for the immersive stage | none | Clerk, `Magnetic`, `useMyUsername` | ⚠ | **Mirrors `Navbar`** — consolidation candidate. |
| `ParticleField` (`particle-field.tsx`) | 2D CSS-keyframe particle atmosphere (7 variants) | `variant` | CSS (inline `fall` keyframe) | ✅ | **Only used in reduced-motion fallback.** |
| `RouteVehicle` (`route-vehicle.tsx`) | 2D SVG route + vehicle riding on scroll | scroll progress | SVG | ✅ | **Only used in reduced-motion fallback.** |

---

## `components/landing/` — Marketing sections (static content in-file)

| Component | Purpose | Deps | Reusable | Notes |
|---|---|---|---|---|
| `FeaturesSection` | 6 feature cards, whileInView reveals | Framer Motion | ⚠ | Content hardcoded. |
| `HowItWorksSection` | 4-step explainer | Framer Motion | ⚠ | — |
| `PricingSection` | 3 plans; CTAs are Clerk `SignInButton`s | Clerk | ⚠ | **No Stripe wiring** (Phase 6). |
| `CTASection` | Dark CTA band, particles + magnetic buttons | `ParticleBackground`, `Magnetic`, `GlowSurface` | ⚠ | — |

---

## `components/dashboard/`

| Component | Purpose | Key props | Deps | Reusable | Notes |
|---|---|---|---|---|---|
| `CreateTripButton` (`create-trip-button.tsx`) | ⭐ Full real flow: create trip → shared upload pipeline → set cover → redirect | none | Clerk, `trip-api`, `lib/upload` | ⚠ | Reference example for write flows. Optional per-stop lat/lng inputs (collapsed); blank still sends `0,0` = "pin not placed" (geocoding still WV-301). |
| `StatsCards` (`stats-cards.tsx`) | 4 animated stat tiles | `stats: DashboardStats` | Framer Motion | ✅ | Also reused by `PersonalHome`. |
| `TripGrid` (`trip-grid.tsx`) | Trip cards w/ tilt, badges, one-click DRAFT publish, hover edit shortcut, empty state | `trips: TripSummary[]` | `TiltCard`, `trip-api` | ✅ | Covers via shared `mediaSrc`. In-card actions are buttons (card is a Link). |

---

## `components/trips/`

| Component | Purpose | Key props | Deps | Reusable | Notes |
|---|---|---|---|---|---|
| `TripDetail` (`trip-detail.tsx`) | Full trip view: hero, action bar (Wander/Like/Journal/Edit/Share), destinations, photo grid, comments | `trip: TripRecord`, `viewerIsOwner?` | `LikeButton`, `ShareButton`, `CommentThread` | ⚠ | ~~Edit & Share non-functional~~ → Edit links to `/trips/[id]/edit` (owner only), Share works. Images via `mediaSrc`. |
| `TripEditor` (`trip-editor.tsx`) | ⭐ Owner editing workhorse: details/publish/cover/photos/itinerary CRUD/danger zone | `trip: TripRecord` | `trip-api` (incl. locations), `lib/upload` | ⚠ | Page: `app/trips/[id]/edit`. Optimistic reorder w/ revert. |
| `ShareButton` (`share-button.tsx`) | Copy trip link; private-trip hint w/ owner "make unlisted & copy" | `tripId`, `privacy`, `viewerIsOwner` | `trip-api`, clipboard | ✅ | Reduced-motion-safe swap animation. |
| `LikeButton` (`like-button.tsx`) | Optimistic like/unlike | `tripId`, initial state | `trip-api`, Clerk | ✅ | Has spec test (revert-on-failure). Reference for optimistic UI. |
| `CommentThread` (`comment-thread.tsx`) | Comment CRUD + replies + optimistic like | `tripId` | `comments-api`, Clerk | ✅ | Complete. |

---

## `components/journal/` — Trip journal (story editor)

| Component | Purpose | Key props | Deps | Reusable | Notes |
|---|---|---|---|---|---|
| `JournalEditor` (`journal-editor.tsx`) | ⭐ Block-based journal over the story API: load, edit, preview, versioned save | `trip: TripRecord`, `canEdit` | `story-api`, `StoryBlockEditor`, `AiAssistPanel` | ⚠ | Page: `app/trips/[id]/journal`. Hero pinned first; **unknown block types preserved on save** (PUT = full replace). `beforeunload` guard when dirty. |
| `StoryBlockEditor` (`story-block.tsx`) | Renders/edits one block (hero/heading/text/photo; opaque fallback) | `block`, `media`, `preview`, callbacks | `mediaSrc` | ⚠ | Photo block picks from trip media thumbnails. |
| `AiAssistPanel` (`ai-assist-panel.tsx`) | Slide-over AI assistant: story draft (tone/length/guidance) + title chips | `trip`, `open`, `onInsertStory`, `onApplyTitle` | `ai-api` (queue+poll) | ⚠ | 403 = credits exhausted, FAILED/timeout handled with friendly copy. |

---

## `components/home/` — Homepage variants

| Component | Purpose | Key props | Deps | Reusable | Notes |
|---|---|---|---|---|---|
| `MarketingHome` (`marketing-home.tsx`) | Signed-out home: lightweight landing (Hero + sections + footer, no WebGL per #18) | none | `landing/*` | ⚠ (**RSC**) | ADR-017. 3D journey remains only at `/trips/[id]/wander`. |
| `PersonalHome` (`personal-home.tsx`) | Signed-in home: greeting, stats, continue-draft card, feed | `me`, `trips`, `tripsTotal`, `feed` | `StatsCards`, `HomeFeed`, `ClaimUsernameBanner` | ⚠ (**RSC**) | Data fetched (and individually degraded) in `app/page.tsx`. |
| `HomeFeed` (`home-feed.tsx`) | Followed-travelers feed: staggered cards, bylines, load-more, empty state | `initialItems`, `initialCursor`, `followsNobody` | `social-api`, `TripCard` | ✅ | Reduced-motion-safe. |

---

## `components/discover/`

| Component | Purpose | Key props | Deps | Reusable | Notes |
|---|---|---|---|---|---|
| `DiscoverGallery` (`discover-gallery.tsx`) | Grid → shared-`layoutId` full-screen expand | `trips: FeedTrip[]` | Framer Motion, `TiltCard`, `TextReveal` | ✅ | Showcase-quality. |
| `KineticShowcase` (`kinetic-showcase.tsx`) | Draggable bento strip, velocity skew/scale | `trips` | Framer Motion | ✅ | — |

---

## `components/profile/`

| Component | Purpose | Key props | Deps | Reusable | Notes |
|---|---|---|---|---|---|
| `FollowButton` (`follow-button.tsx`) | Fetch relationship + follow/unfollow; self/signed-out states | `username` | Clerk, `social-api` | ✅ | ~~ad-hoc fetch~~ → now uses `lib/social-api.ts` (WV-105 resolved). |
| `TripCard` (`trip-card.tsx`) | Presentational trip card | `trip: FeedTrip` | `cn`, `mediaSrc` | ✅ (**RSC**) | Reused by profiles, DiscoverGallery **and HomeFeed**. Local `formatRange` overlaps `utils` date fns. |
| `ProfileEditor` (`profile-editor.tsx`) | Edit own profile: displayName/username/bio/location/website/avatar | none | `users-api`, Clerk | ⚠ | Page: `app/settings/profile`. Inline 409 "username taken" under the field. |
| `ClaimUsernameBanner` (`claim-username-banner.tsx`) | Onboarding nudge until a username exists | none | `use-me` | ✅ | Mounted on dashboard + personal home; sessionStorage dismiss. |
| `UserList` (`user-list.tsx`) | Follower/following rows w/ FollowButton | `users`, `emptyMessage` | `FollowButton` | ✅ (**RSC**) | Pages: `profiles/[username]/followers` + `/following`. |
| `EditProfileLink` (`edit-profile-link.tsx`) | "Edit profile" button when viewing own profile | `username` | `use-my-username` | ✅ | — |

---

## `components/providers/`

| Component | Purpose | Deps | Notes |
|---|---|---|---|
| `SmoothScroll` (`smooth-scroll.tsx`) | Lenis inertia scroll; disabled for reduced-motion | Lenis | Global, effect-only (`null` render). |

---

## `components/map/` — ✅ REMOVED (Phase 0 cleanup)

The dead `MapViewer` component (a full Mapbox GL wrapper, imported nowhere) and its `components/map/` folder were **removed in Phase 0 cleanup**, along with the `mapbox-gl`/`@types/mapbox-gl` dependencies it held hostage. The app renders geography with R3F globes (`components/three/`). If a 2D map is ever needed again, build it fresh against the then-current requirements — don't resurrect the old file from git history without review.

---

## Refactor themes across the registry (see [`17_TECH_DEBT.md`](./17_TECH_DEBT.md))
- **Two navbars** (`Navbar` + `JourneyNav`) share nav links + auth logic → consolidate.
- **Cover/media URL resolution** duplicated in `TripDetail`, `TripGrid`, `trip-to-journey`.
- **`toVector3`** duplicated in `Globe` + `JourneyScene`.
- **`FollowButton`** should use the consolidated API client (WV-105).
- **Non-functional stubs:** TripDetail Edit/Share, `/destinations/[id]` "coming soon", footer social/dead links.
