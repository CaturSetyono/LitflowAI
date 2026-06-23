<div align="center">

<img src="public/litflow-logo.png" alt="LitFlow AI logo" width="160" height="160" />

# LitFlow AI — Anna App

### Discover what hasn't been researched yet.

An AI-native research copilot, packaged as a native **[Anna](https://anna.partners) App**, that
turns a single research topic into a structured literature review — with a relentless focus on
surfacing **research gaps**.

</div>

---

## What this is

LitFlow AI runs a guided **5-stage pipeline** entirely inside an Anna App window. It reaches the
language model through the host — `anna.llm.complete` — so **no API key is stored**; completions run
on the signed-in user's Anna account and chosen model.

| # | Stage | Engine | Output |
|---|---|---|---|
| 1 | Research Planning | `anna.llm.complete` | Research questions, keywords, search strategy |
| 2 | Source Discovery | CrossRef + arXiv (direct fetch) | Ranked, deduped papers |
| 3 | Insight Extraction | `anna.llm.complete` (1 batched call) | Findings, methodology, limitations |
| 4 | Gap Discovery | `anna.llm.complete` | Themes, gaps, contradictions, opportunities |
| 5 | Literature Review | `anna.llm.complete` | Structured Markdown review |

> Source discovery hits **CrossRef** and **arXiv** directly from the app window — the two API
> origins are declared in `manifest.json` under both `ui.bundle.external_origins` and
> `ui.csp_overrides.connect-src`.

## Architecture

This is a **static SPA** Anna App (`format: "static-spa"`) — no server, no Next.js.

```
bundle/
  index.html     # SPA shell (loads app.js as an ES module)
  style.css      # dark theme + 5-step rail
  app.js         # AnnaAppRuntime.connect() + the 5-step state machine (plain DOM)
  pipeline.js    # the engine: each step calls anna.llm.complete or fetches sources
  prompts.js     # system/user prompts for every agent
  sources.js     # CrossRef + arXiv clients, merge / dedupe / rank
  json.js        # balanced-JSON extraction + shape coercion (no Zod)
  markdown.js    # tiny Markdown → HTML renderer for the review
app.json         # product metadata
manifest.json    # schema 2: host_api.llm, CSP, external origins, window
fixtures/        # mock data for `anna-app dev --mock-llm`
```

The host LLM surface used (declared in `manifest.json` → `ui.host_api`):

```js
const anna = await AnnaAppRuntime.connect();
const reply = await anna.llm.complete({
  messages: [{ role: "user", content: { type: "text", text: userPrompt } }],
  systemPrompt, maxTokens, temperature,
});
const text = reply?.content?.text ?? "";
```

## Getting started

### Prerequisites

- **Node.js 22+**
- The Anna CLI and an Anna account:

```bash
npm install -g @anna-ai/cli
anna-app --help
anna-app doctor          # most important pre-flight check
```

### Log in

```bash
anna-app login --host https://anna.partners
anna-app whoami
```

This saves a PAT (~90-day) so `anna-app dev` can reach real platform capabilities (LLM etc.).

### Run locally

From the repo root (where `app.json` / `manifest.json` live):

```bash
anna-app validate --strict     # checks bundle ↔ manifest host_api declarations
anna-app dev                   # opens at http://localhost:5180/
```

Enter a topic (e.g. *"AI in Sustainable Agriculture"*) and watch the 5 stages run.

UI-only smoke test without spending quota (mock LLM; source fetches still hit the network):

```bash
anna-app dev --mock-llm fixtures/happy-path.jsonl
```

### Publish

```bash
anna-app apps push             # uploads the bundle + manifest as a working draft
anna-app apps cut 0.1.0        # cuts an immutable version
```

Then on the developer page: **install** the cut version → open **Installed Apps** → enable the
**LLM completion** permission. Submit for review to publish publicly.

## Notes & trade-offs

- **The literature review renders once** when the model responds. The Host API
  `anna.llm.complete` is request/response, so there is no token-by-token streaming (unlike the
  original Next.js build).
- **arXiv CORS** from a browser is best-effort. If it is blocked, discovery degrades gracefully to
  **CrossRef only** (which is CORS-enabled).
- **Insight extraction is capped at ~10 papers** in a single batched call to stay within the
  model's output-token budget.
- No API keys anywhere — the model is the signed-in user's Anna account model.

---

<div align="center">

**LitFlow AI** — *the future of research is discovering what comes next.*

</div>
