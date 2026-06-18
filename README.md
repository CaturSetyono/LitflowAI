# LitFlow AI

> Discover what hasn't been researched yet.

An AI-native research copilot that turns a research topic into a structured
literature review — with a focus on discovering **research gaps**. Built with
Next.js 15 (App Router), TypeScript, Tailwind CSS, and shadcn/ui, with all
models served through **OpenRouter**.

## How it works

A guided, step-by-step workflow (each step is its own API route, so it stays
within serverless time limits):

1. **Research Planning** — generates research questions, keywords, and a search strategy.
2. **Source Discovery** — fetches papers from CrossRef + arXiv (no API key required).
3. **Insight Extraction** — extracts key findings, methodology, and limitations (batched into one AI call).
4. **Gap Discovery** — clusters themes and finds over/under-researched areas, contradictions, missing combinations, and opportunities.
5. **Literature Review** — streams a structured review (Introduction → Conclusion).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in OPENROUTER_API_KEY
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | Your OpenRouter key — https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | – | Defaults to `nex-agi/nex-n2-pro:free`. Swap to any OpenRouter model without code changes. |
| `CROSSREF_MAILTO` | – | Contact email for CrossRef's polite API pool. |

> The default model is a free tier with strict rate limits. The app minimizes
> AI calls (≈4 per run via batching) and repairs malformed JSON, but if you hit
> quota errors, set `OPENROUTER_MODEL` to a paid model.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in
   **Project → Settings → Environment Variables**.
3. Deploy.

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Vercel AI SDK · OpenRouter · Zod
