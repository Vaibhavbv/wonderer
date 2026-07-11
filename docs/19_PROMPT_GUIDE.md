# 19 — Prompt Guide (for working on Wanderverse with AI assistants)

> How to get great results from Claude/Opus/Fable/Cursor/etc. on this repo — for the human directing the AI, and for the AI itself. The single biggest lever: **point the AI at [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md) and [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) first.**

---

## The one rule that saves the most tokens

Start (or configure) every AI session with:

> "Read `docs/05_AI_CONTEXT.md` and `docs/15_PHASE_STATUS.md` before doing anything, then [task]."

Better: add that line to `CLAUDE.md`/`.cursorrules` so it happens automatically. These two files were built to replace the "let me re-explain the project" tax.

---

## Prompt templates

### 1. New feature
```
Read docs/05_AI_CONTEXT.md and docs/15_PHASE_STATUS.md first.

Feature: <what & why, from the user's POV>.
Phase check: confirm this fits the current phase (07_ROADMAP) or say so.
Scope: backend + frontend as needed.
Constraints: preserve the response envelope + auth model; reuse components/ui;
  keep the brand (coral #FF5A4D, serif headlines, air); add reduced-motion paths.
Deliver: schema+migration (if needed) → DTO → service+test → controller → lib client
  → UI → docs updates (10/11/12/20/15).
Verify: type-check, lint, tests, and actually run the flow.
```

### 2. Bug fix
```
Read docs/05_AI_CONTEXT.md and docs/17_TECH_DEBT.md first.
Bug: <symptom + repro>.
First check if it's a known item in 17_TECH_DEBT.md.
Find root cause (don't patch symptoms). Add a regression test. Update the changelog.
Don't change the response envelope or auth without calling it out.
```

### 3. Refactor / cleanup
```
Read docs/05_AI_CONTEXT.md and docs/13_DEPENDENCY_GUIDE.md first.
Refactor: <target, e.g. "consolidate the 4 duplicated API clients — WV-105">.
No behavior change. Prove non-use with grep across the whole app before deleting.
Keep tests green; add tests if coverage is thin. Update affected docs.
```

### 4. Understand before acting
```
Read docs/05_AI_CONTEXT.md, then explain how <X> works in this codebase,
citing exact files. Tell me if <X> is actually built or a stub/placeholder
(check 17_TECH_DEBT / 05_AI_CONTEXT "MODELED ≠ BUILT"). Don't write code yet.
```

### 5. Schema change
```
Read docs/05_AI_CONTEXT.md and docs/12_DATABASE_SCHEMA.md first.
Change: <model change>.
Edit schema.prisma, create a NEW migration (never edit an applied one),
regenerate the client, update services + 12_DATABASE_SCHEMA.md, keep counters consistent.
```

---

## Rules for the AI (repeat of the essentials)
1. **Read `05_AI_CONTEXT.md` + `15_PHASE_STATUS.md` first.**
2. **Verify a capability is real before building on it** — schema/enum/dependency ≠ working feature.
3. **Preserve the contract:** response envelope + Clerk auth model.
4. **Reuse before writing** — this repo's top debt is duplication.
5. **Match surrounding style** (kebab files, PascalCase components, no `any`).
6. **Never edit an applied migration.**
7. **Respect the brand + motion** (coral only, serif/sans system, reduced-motion paths).
8. **Update the docs you invalidate**, and leave a breadcrumb in `15_PHASE_STATUS.md` + `20_CHANGELOG.md`.
9. **Verify by running the flow**, not just types/tests.
10. **Don't trust `QUICKSTART.md` verbatim** (partly stale) — trust the numbered docs.

---

## Best practices (for the human)
- **Name the phase.** "This is Phase 1 stabilization" prevents scope creep into features.
- **Reference tickets.** "Do WV-102" is unambiguous and pre-scoped ([`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md)).
- **Ask for a plan on anything non-trivial** before code; approve, then let it build.
- **Prefer small, verifiable changes** over giant PRs — easier to review and revert.
- **Ask it to run the app / tests** and report real output, not just claim success.
- **Point at the file** when you can (`components/three/journey-scene.tsx`) — cheaper than making it search.
- **Feed back corrections into the docs** (or ask the AI to) so the next session benefits.

---

## Common mistakes (and how to prevent them)

| Mistake | Prevention prompt-nudge |
|---|---|
| Builds on a stub as if real | "Confirm <X> is implemented (not a placeholder) before building on it." |
| Breaks the response envelope | "Do not change the `{success,data,meta,error}` envelope." |
| Adds a 5th copy of the API helper | "Use/extend the shared API client; don't duplicate `unwrap`/`API_URL`." |
| Introduces GSAP / a new anim lib | "Use Framer Motion + R3F; do not add animation libraries." |
| Adds a second accent color | "Coral `#FF5A4D` is the only accent — keep the design law." |
| Uses `request.user.id` as a Clerk id | "`@CurrentUser('id')` is the DB cuid, not the Clerk id." |
| Forgets reduced-motion | "Add a `prefers-reduced-motion` path for any animation." |
| Edits an applied migration | "Create a NEW migration; never edit an existing one." |
| Refactors `journey-scene` casually | "Treat `journey-scene.tsx` as fragile; minimal, measured changes only." |
| Leaves docs stale | "Update the affected `/docs` and add a `20_CHANGELOG.md` line." |

---

## Suggested `CLAUDE.md` / `.cursorrules` seed
```
This is Wanderverse ("Instagram for your travel life"). Before any task, read
docs/05_AI_CONTEXT.md and docs/15_PHASE_STATUS.md. Key rules: don't change the API
response envelope {success,data,meta,error} or the Clerk auth model; a schema/enum/
dependency existing does NOT mean the feature is built (check docs/17_TECH_DEBT.md);
reuse components/ui and the shared API client instead of duplicating; keep the brand
(one accent, coral #FF5A4D; Playfair serif headlines + Inter body; reduced-motion paths);
never edit an applied Prisma migration; update the docs you invalidate.
```
