# 14 — Git Workflow

> How we branch, commit, review, merge, release, and version. Derived from the repo's existing history conventions (PR-per-change, imperative commit subjects, fix/feat branch prefixes) and formalized for Phase 1+.

---

## Branch model

**Trunk-based with short-lived feature branches.** `main` is always deployable.

Observed long-lived branches in the remote: `main`, `v1`, `v2` (release/version lines). Treat `main` as the integration trunk; version lines are cut from it.

### Branch naming
```
<type>/<short-kebab-summary>
```
| Type | Use | Example |
|---|---|---|
| `feat/` | New feature | `feat/save-to-bucket-list` |
| `fix/` | Bug fix | `fix/duplicate-trip-access-check` |
| `chore/` | Tooling/deps/config | `chore/remove-dead-deps` |
| `docs/` | Docs only | `docs/phase-0-foundation` |
| `refactor/` | No behavior change | `refactor/unify-api-client` |
| `perf/` | Performance | `perf/journey-scene-instancing` |
| `test/` | Tests only | `test/comments-service` |

Include a ticket id from [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md) when applicable: `fix/wv-102-duplicate-access`.

---

## Commit conventions

**Imperative, present-tense subject; capitalized; no trailing period; ≤ ~72 chars.** This matches existing history (e.g. *"Fix Clerk auth guard rejecting all valid tokens"*, *"Promote cinematic journey experience to homepage"*).

```
<Imperative subject>

<Optional body: what & why, wrapped ~72 cols.>
<Reference tickets: WV-102. Note breaking changes explicitly.>
```

➕ **Optional (recommended for Phase 1+): Conventional Commits prefix** for machine-readable history and changelog automation:
```
feat: add save-to-bucket-list endpoint
fix(trips): enforce access check in duplicateTrip (WV-102)
chore(deps): remove gsap and zustand (WV-110)
docs: add Phase 0 documentation set
```
Pick one style per line of work and stay consistent. If unsure, match the plain imperative style already in `git log`.

**Rules:**
- One logical change per commit; keep them reviewable.
- Never commit secrets (`.env`/`.env.local` are gitignored — keep them so).
- Don't commit commented-out code.
- Prefer new commits over amending shared history.
- Don't skip hooks (`--no-verify`) unless explicitly asked.

---

## Feature workflow

```
1. git checkout main && git pull
2. git checkout -b feat/wv-XYZ-short-summary
3. Work in small commits. Run type-check + lint + tests locally.
4. Update the relevant /docs (registry, API ref, changelog, phase status).
5. Push; open a PR into main.
6. CI green + review approved → merge.
```

- Keep PRs focused and small; large mechanical changes (dep removal, rename) go in their own PR.
- Every PR description: what changed, why, which tickets, how verified, and any doc updates.

---

## Merge strategy

- **Squash-merge** feature branches into `main` (the history shows PR-numbered squashes like `(#17)`) → one clean commit per PR, subject = PR title.
- Delete the branch after merge.
- Rebase your branch on `main` before merging if it's stale; resolve conflicts locally.
- No direct pushes to `main` — go through a PR.

---

## Review

- At least one approval before merge (or the maintainer's self-merge for solo work — still open the PR for the record).
- CI must be green (build + lint + tests for both apps).
- Reviewers check: contract preserved (envelope/auth), no new duplication, tests present, docs updated, brand/motion respected.
- Use `/code-review` locally before pushing for a fast pass.

---

## Release strategy

- **`main` is continuously deployable.** Deploys are driven by `render.yaml` (backend on Render) and the frontend host; see `DEPLOYMENT.md`.
- **Version lines** (`v1`, `v2`) are cut from `main` for milestone releases. `v2` corresponds to the "Wanderverse V2" effort this doc set kicks off (Phase 0+).
- Tag releases `vMAJOR.MINOR.PATCH` at the cut.
- Migrations deploy with `prisma migrate deploy` (never `migrate dev` in prod). Backwards-compatible migrations preferred; coordinate breaking DB changes with a deploy plan.

---

## Versioning

- **SemVer** for the product/release lines: `MAJOR.MINOR.PATCH`.
  - MAJOR: breaking API/schema/contract changes.
  - MINOR: backwards-compatible features.
  - PATCH: fixes.
- Both apps currently declare `1.0.0` in their `package.json`. Bump on release; keep web/api versions aligned per release line unless they intentionally diverge.
- **API versioning is separate:** the REST API is URI-versioned (`/v1`). A breaking API change introduces `/v2` routes rather than mutating `/v1` — record the decision in [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).
- Record notable releases in [`20_CHANGELOG.md`](./20_CHANGELOG.md).

---

## Hotfixes
`fix/` branch off `main` → PR → squash-merge → deploy. Cherry-pick to active version lines if needed.

---

## Quick reference
```
# start work
git checkout main && git pull && git checkout -b feat/wv-XYZ-thing
# before PR
(cd apps/api && npm run build && npm test)     # backend gate
(cd apps/web && npm run type-check && npm run lint && npm test)  # frontend gate
# commit
git commit -m "feat(trips): add X (WV-XYZ)"
```
