# Wanderverse — Locked Product Vision & Build Brief

**One-liner:** Instagram for your travel life. Your profile is a living map of everywhere you've ever been; you follow friends and creators to watch their journeys unfold in a bright, editorial feed.

**Wedge audience:** Digital nomads and long-term travelers — they travel most, share most, and produce the content everyone else comes to watch. Every screen must make them look incredible.

## Name & brand

- Keep **Wanderverse**. Tagline: **"Map your life."**
- Identity: bright editorial / magazine — large serif headlines, full-bleed photography, generous whitespace, a soft light/monochrome Mapbox base map.
- One signature accent only — **Sunset Coral (`#FF5A4D`)** — used for the mascot, the route line, and CTAs. Everything else stays black / white / paper so the coral is the only thing that glows.

## Mascot vehicle

A small illustrated airplane in Sunset Coral that flies your routes across the map, trailing a dotted contrail. It is the logo and the mascot. Twist: the vehicle morphs to the transport mode of each leg — plane for flights, camper van for road trips, train, ferry — same illustrated family, same coral. Default brand icon = the plane.

## Profile = your travel life map (the show-off screen)

Not scattered pins — **one continuous connected route line that grows trip-by-trip in date order.** Hit "Replay" and the plane flies your entire life of travel from first trip to latest, photos popping up along the way. Public by default (SEO'd, shareable pages), with a private toggle. Pinned at the top: a live **Travel Passport** — countries unlocked, continents, cities, total km, a stamp collection.

## Feed & social

- **One-way followers** like Instagram (not mutual friends) — built for reach and creators. Public accounts default, private option.
- Two content modes: permanent **Trips** (hero posts that live on your map forever) and ephemeral **Stories** ("in Lisbon right now").
- Actions: like, comment, reshare, and the signature one — **Save to Bucket List**: one tap on any place in someone's trip drops it onto your own future-map.
- The loop: watch a journey → save the place → go → post it → your followers save it.

## Content unit

Both, nested. A **Moment** = one photo/video + location + caption, posted live or later. Moments auto-cluster by place and date into a **Trip**. The Trip is the shareable hero unit that lives on your map.

## The hook (why people pour their whole travel life in)

An auto-generated cinematic **Trip Recap** — your route animates across the map, best photos cut to music, ending on your updated passport stats. Exportable as a vertical video watermarked with your `@handle`, built to be posted to Instagram / TikTok. That export IS the growth engine: every recap shared elsewhere recruits the next user. Plus a year-end **"Year in Travel" wrapped**.

## Monetization

Freemium.
- **Free** = the full social app.
- **Pro** = premium map themes, exclusive editorial profile layouts, high-res watermark-free recap exports.
- **Later:** creator subscriptions (paid itineraries/guides), tourism-board partnerships, "book this exact trip" affiliate links on any Trip.

## Build priority

Schema already models `User`/`Trip`/`Follow`/`Like`/`Comment`/`Media` — this is wiring + the editorial experience on top, not a rewrite.

1. **Identity layer** — profiles + follow graph + feed endpoints
2. **Signature profile map** — connected growing route + replay + passport
3. **Home feed** of followed journeys (newest first) + discovery tab
4. **Viral loop** — likes, comments, reshare cards, Save to Bucket List
5. **The hook** — auto-generated Trip Recap export

## Design law

Light map, one coral accent, serif headlines, full-bleed photos, lots of air. If a screen doesn't make a nomad want to screenshot it, redo it.
