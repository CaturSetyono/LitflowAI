import { z } from "zod";

/** Step 2 — Research Planner Agent */
export const planSchema = z.object({
  researchQuestions: z.array(z.string()).min(1),
  keywords: z.array(z.string()).min(1),
  searchStrategy: z.string(),
});
export type ResearchPlan = z.infer<typeof planSchema>;

/** Step 3 — a single academic source (from CrossRef / arXiv) */
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number | null;
  citationCount: number | null;
  source: "crossref" | "arxiv";
  url: string | null;
  doi: string | null;
}

/** Step 4 — Insight Extraction Agent (batched) */
export const insightSchema = z.object({
  id: z.string(),
  keyFindings: z.array(z.string()),
  methodology: z.string(),
  contributions: z.array(z.string()),
  limitations: z.array(z.string()),
});
export const insightsSchema = z.object({
  insights: z.array(insightSchema),
});
export type Insight = z.infer<typeof insightSchema>;

/** Step 5 + 6 + 7 — Gap Discovery Agent */
export const themeSchema = z.object({
  name: z.string(),
  description: z.string(),
  paperIds: z.array(z.string()).default([]),
});
export const opportunitySchema = z.object({
  title: z.string(),
  rationale: z.string(),
  expectedContributions: z.array(z.string()).default([]),
});
export const gapSchema = z.object({
  themes: z.array(themeSchema),
  overResearched: z.array(z.string()),
  underExplored: z.array(z.string()),
  contradictions: z.array(z.string()),
  missingCombinations: z.array(z.string()),
  opportunities: z.array(opportunitySchema),
});
export type GapAnalysis = z.infer<typeof gapSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
