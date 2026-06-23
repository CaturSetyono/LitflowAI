// Ported verbatim from the Next.js app's lib/prompts.ts.
// System/user prompt builders for every agent in the pipeline.

const JSON_RULES =
  "You are a precise research assistant. Always answer in English. Output must be a single valid JSON value with no markdown fences and no commentary.";

/** Step 1 — Research Planner Agent */
export function planPrompts(topic) {
  return {
    system:
      JSON_RULES +
      " You generate a research plan for a given topic. " +
      'Return JSON of shape: {"researchQuestions": string[], "keywords": string[], "searchStrategy": string}. ' +
      "Provide 4-6 focused research questions, 6-10 search keywords/phrases, and a concise 2-3 sentence search strategy.",
    user: `Research topic: "${topic}"`,
  };
}

/** Step 3 — Insight Extraction Agent (batched over all papers) */
export function insightPrompts(topic, papers) {
  const corpus = papers
    .map(
      (p) =>
        `### Paper ${p.id}\nTitle: ${p.title}\nYear: ${p.year ?? "n/a"}\nAbstract: ${
          p.abstract || "(no abstract available)"
        }`
    )
    .join("\n\n");

  return {
    system:
      JSON_RULES +
      " You extract structured insights from academic abstracts. " +
      'Return JSON of shape: {"insights": [{"id": string, "keyFindings": string[], "methodology": string, "contributions": string[], "limitations": string[]}]}. ' +
      "The id MUST match the paper id given. Base everything strictly on the abstract; if information is missing, infer conservatively or use an empty array. Keep each item to one short sentence.",
    user: `Topic: "${topic}"\n\nAnalyze every paper below and return one insight object per paper.\n\n${corpus}`,
  };
}

/** Step 4 — Gap Discovery Agent (themes + gaps + opportunities) */
export function gapPrompts(topic, papers, insights) {
  const byId = new Map(papers.map((p) => [p.id, p]));
  const corpus = insights
    .map((ins) => {
      const p = byId.get(ins.id);
      return `### ${ins.id} — ${p?.title ?? "Untitled"} (${p?.year ?? "n/a"})\nFindings: ${ins.keyFindings.join("; ")}\nMethodology: ${ins.methodology}\nLimitations: ${ins.limitations.join("; ")}`;
    })
    .join("\n\n");

  return {
    system:
      JSON_RULES +
      " You are the Gap Discovery Engine: your job is to find what has NOT been researched yet. " +
      "Analyze the corpus collectively (not paper by paper). " +
      'Return JSON of shape: {"themes": [{"name": string, "description": string, "paperIds": string[]}], "overResearched": string[], "underExplored": string[], "contradictions": string[], "missingCombinations": string[], "opportunities": [{"title": string, "rationale": string, "expectedContributions": string[]}]}. ' +
      "Provide 3-5 themes (cluster the papers, fill paperIds with matching ids), and 2-5 items for each gap array. Opportunities must be concrete, novel research directions derived from the gaps.",
    user: `Topic: "${topic}"\n\nCorpus of extracted insights:\n\n${corpus}`,
  };
}

/** Step 5 — Literature Review Agent (Markdown) */
export function reviewPrompts(topic, plan, papers, gaps) {
  const refs = papers
    .map(
      (p, i) =>
        `[${i + 1}] ${p.authors.slice(0, 3).join(", ")}${
          p.authors.length > 3 ? " et al." : ""
        } (${p.year ?? "n.d."}). ${p.title}.`
    )
    .join("\n");

  return {
    system:
      "You are an academic writing assistant. Write in formal academic English using GitHub-flavored Markdown. " +
      "Produce a structured literature review with exactly these second-level headings in order: " +
      "## Introduction, ## Existing Research, ## Research Trends, ## Research Gaps, ## Future Research Directions, ## Conclusion. " +
      "Reference papers inline as [n] using the provided reference list. Be specific, grounded in the supplied material, and emphasize the discovered research gaps and opportunities.",
    user:
      `Topic: "${topic}"\n\n` +
      `Research questions:\n- ${plan.researchQuestions.join("\n- ")}\n\n` +
      `Themes: ${gaps.themes.map((t) => t.name).join(", ")}\n` +
      `Over-researched: ${gaps.overResearched.join("; ")}\n` +
      `Under-explored: ${gaps.underExplored.join("; ")}\n` +
      `Contradictions: ${gaps.contradictions.join("; ")}\n` +
      `Missing combinations: ${gaps.missingCombinations.join("; ")}\n` +
      `Opportunities: ${gaps.opportunities.map((o) => o.title).join("; ")}\n\n` +
      `References:\n${refs}`,
  };
}
