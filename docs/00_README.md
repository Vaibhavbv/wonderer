# Wanderverse — Documentation Index

> **Wanderverse = "Instagram for your travel life. Map your life."** A social network where your profile is a living map of everywhere you've been, and each trip becomes a cinematic, scroll-driven 3D-globe story.

This `docs/` set is the **canonical, AI-first documentation** for the repository. It exists so that any contributor — human or AI — can understand and safely extend the project **without re-explanation**.

---

## 🤖 If you are an AI assistant: read these two first
1. **[`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md)** — everything you must know before writing code (⭐ start here).
2. **[`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md)** — what's happening *right now* (📍 live status).
3. **[`00_SESSION_CONTEXT.md`](./00_SESSION_CONTEXT.md)** — the session-by-session narrative of how the repo got here.

Then read whatever the task needs from the index below.

---

## The numbered set (00–20)

| # | Doc | What it's for |
|---|---|---|
| 00 | [Session Context](./00_SESSION_CONTEXT.md) | Chronological handoff log of each working session |
| 01 | [Project Overview](./01_PROJECT_OVERVIEW.md) | What Wanderverse is, vision, audience, current features vs. future |
| 02 | [Architecture](./02_ARCHITECTURE.md) | System map, data flow, frontend/backend/auth/API/DB architecture |
| 03 | [Codebase Guide](./03_CODEBASE_GUIDE.md) | Where things live; what must never be modified casually |
| 04 | [Coding Standards](./04_CODING_STANDARDS.md) | Naming, TS/React conventions, imports, formatting, performance |
| 05 | [**AI Context**](./05_AI_CONTEXT.md) ⭐ | The most important doc — read before coding |
| 06 | [Product Bible](./06_PRODUCT_BIBLE.md) | Philosophy, design/motion principles, how it should *feel* |
| 07 | [Roadmap](./07_ROADMAP.md) | Phases 0–10: milestones, dependencies, deliverables |
| 08 | [Engineering Backlog](./08_ENGINEERING_BACKLOG.md) | Concrete tickets (WV-###) with AC/DoD/priority |
| 09 | [Folder Structure](./09_FOLDER_STRUCTURE.md) | Complete tree; why each folder exists; where new code goes |
| 10 | [Component Registry](./10_COMPONENT_REGISTRY.md) | Every frontend component: purpose, props, reuse, refactor notes |
| 11 | [API Reference](./11_API_REFERENCE.md) | Every endpoint: method, auth, I/O, status |
| 12 | [Database Schema](./12_DATABASE_SCHEMA.md) | Every model, relationship, index, enum; dead schema flagged |
| 13 | [Dependency Guide](./13_DEPENDENCY_GUIDE.md) | Every dependency: keep / remove / planned |
| 14 | [Git Workflow](./14_GIT_WORKFLOW.md) | Branches, commits, merge, release, versioning |
| 15 | [**Phase Status**](./15_PHASE_STATUS.md) 📍 | Live: current/completed/in-progress/blocked/next |
| 16 | [Decisions Log](./16_DECISIONS_LOG.md) | ADRs: what was decided and why |
| 17 | [Tech Debt](./17_TECH_DEBT.md) | Known problems, ranked, with fix tickets |
| 18 | [Performance Guide](./18_PERFORMANCE_GUIDE.md) | Bottlenecks, strategy, Three.js perf rules |
| 19 | [Prompt Guide](./19_PROMPT_GUIDE.md) | How to work on this repo with AI; prompt templates |
| 20 | [Changelog](./20_CHANGELOG.md) | Notable changes, milestones, version history |

## Phase reports
- [PHASE_0_COMPLETION_REPORT.md](./PHASE_0_COMPLETION_REPORT.md) ✅ — final Phase 0 report (accomplishments, status, remaining debt, Phase 1 readiness)
- [PHASE_0_AUDIT_REPORT.md](./PHASE_0_AUDIT_REPORT.md) — superseded mid-phase baseline snapshot (kept as the dated record)

## Strategic source docs (preserved)
The founder's original material — kept as reference. **For product *intent*, [`MASTERPLAN.md`](./MASTERPLAN.md) is authoritative;** for *current code state*, the numbered docs win (they're audited against the code).

- [MASTERPLAN.md](./MASTERPLAN.md) ⭐ locked product vision · [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [API_DESIGN.md](./API_DESIGN.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [MONETIZATION.md](./MONETIZATION.md) · [ROADMAP.md](./ROADMAP.md)

---

## Quick facts
- **Monorepo:** `apps/web` (Next.js 15 / React 19 / Tailwind v4 / R3F / Framer Motion) + `apps/api` (NestJS 10 / Prisma 6 / Postgres / Redis+BullMQ / Clerk / S3 / OpenAI).
- **Auth:** Clerk (stateless JWT per request). **API:** REST, versioned `/v1`, envelope `{success,data,meta,error}`.
- **Run:** `cd apps/web && npm install && npm run dev` (:3000); `cd apps/api && npm install && npm run start:dev` (:3001, needs Postgres+Redis).
- **Current phase:** Phase 0 ✅ complete — Phase 1 (stabilization) next, awaiting kickoff. Always confirm in [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md).

⚠️ **Golden gotcha:** a model/enum/dependency existing does **not** mean the feature is built. Verify against [`17_TECH_DEBT.md`](./17_TECH_DEBT.md) / [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md) before building on any capability.

---

## Maintaining these docs
Docs are only useful if current. When you make a change, update the docs it touches — at minimum [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) and [`20_CHANGELOG.md`](./20_CHANGELOG.md), plus the registry/reference/schema doc if you changed a component/endpoint/model, and [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md) for any architectural call. See [`04_CODING_STANDARDS.md`](./04_CODING_STANDARDS.md) → "Definition of done."
