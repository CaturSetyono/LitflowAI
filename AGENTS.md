# LitFlow AI — AGENTS.md

## Repo structure

- **`bundle/`** — the Anna App (static SPA, plain ES modules, no bundler). Entry: `bundle/index.html`.
- **Root `index.html` + `landing.css`** — standalone marketing landing page for Vercel (`vercel.json` serves root; no build step).
- **`fixtures/`** — mock LLM data for `--mock-llm`.
- **`push.sh`** — per-file commit + push script (team uses for auto-push).
- **`.claude/skills/design/SKILL.md`** — design system reference for landing page.

## Commands

```bash
anna-app doctor                # pre-flight: check CLI, auth, manifest
npm run validate               # static check: bundle ↔ manifest consistency
npm run dev                    # local dev at localhost:5180 (via anna-app --slug litflow-ai)
npm run dev:mock               # smoke test with mock LLM (fixtures/happy-path.jsonl), no quota cost
npm run dev:off                # dev without LLM at all
npm run push                   # upload bundle as draft to Anna platform
npm run cut                    # cut an immutable version (0.1.0)
```

## Key conventions

- **No bundler, no build step.** Edit `bundle/` files directly; they are ES modules loaded from `bundle/index.html`.
- **No API keys.** All LLM calls go through `anna.llm.complete` (host runtime, billed to signed-in Anna user).
- **External origins** (CrossRef, arXiv) declared in `manifest.json` → `ui.bundle.external_origins` + `ui.csp_overrides.connect-src`. Both must stay in sync.
- **No test framework.** Smoke testing is manual via `npm run dev:mock`. E2E via Playwright MCP (`.mcp.json` + `.claude/settings.local.json`).
- **Commit style:** `push.sh` generates per-file conventional commits (`feat(path): msg`, `docs(path): msg`, etc.). Agents should use standard single commits instead.
- **Vercel:** static output `outputDirectory: "."` (root), no build command.
- **Design system** for landing page exists at `.claude/skills/design/SKILL.md` — load for pixel/accent/typography guidance.
