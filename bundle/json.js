// JSON extraction + light shape coercion, replacing lib/ai.ts + Zod schemas.
// Free models often wrap JSON in prose or ```json fences.

/** Extract the first balanced JSON object/array from a model response. */
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

// ── Coercion helpers — enforce the same shapes the Zod schemas guaranteed ──

const arr = (v) => (Array.isArray(v) ? v : []);
const strArr = (v) => arr(v).map((x) => String(x)).filter(Boolean);
const str = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));

/** plan: { researchQuestions[], keywords[], searchStrategy } */
export function coercePlan(o) {
  o = o || {};
  const plan = {
    researchQuestions: strArr(o.researchQuestions),
    keywords: strArr(o.keywords),
    searchStrategy: str(o.searchStrategy),
  };
  if (!plan.researchQuestions.length || !plan.keywords.length) {
    throw new Error("Plan missing research questions or keywords.");
  }
  return plan;
}

/** insights: { insights: [{ id, keyFindings[], methodology, contributions[], limitations[] }] } */
export function coerceInsights(o) {
  o = o || {};
  const insights = arr(o.insights).map((ins) => ({
    id: str(ins?.id),
    keyFindings: strArr(ins?.keyFindings),
    methodology: str(ins?.methodology),
    contributions: strArr(ins?.contributions),
    limitations: strArr(ins?.limitations),
  }));
  return { insights };
}

/** gaps: themes[], overResearched[], underExplored[], contradictions[], missingCombinations[], opportunities[] */
export function coerceGaps(o) {
  o = o || {};
  return {
    themes: arr(o.themes).map((t) => ({
      name: str(t?.name),
      description: str(t?.description),
      paperIds: strArr(t?.paperIds),
    })),
    overResearched: strArr(o.overResearched),
    underExplored: strArr(o.underExplored),
    contradictions: strArr(o.contradictions),
    missingCombinations: strArr(o.missingCombinations),
    opportunities: arr(o.opportunities).map((op) => ({
      title: str(op?.title),
      rationale: str(op?.rationale),
      expectedContributions: strArr(op?.expectedContributions),
    })),
  };
}
