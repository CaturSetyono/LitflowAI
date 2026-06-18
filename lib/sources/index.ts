import type { Paper } from "../schemas";
import { searchCrossref } from "./crossref";
import { searchArxiv } from "./arxiv";

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scorePaper(p: Paper, keywords: string[]): number {
  const hay = `${p.title} ${p.abstract}`.toLowerCase();
  const keywordHits = keywords.reduce(
    (acc, k) => acc + (hay.includes(k.toLowerCase()) ? 1 : 0),
    0
  );
  const citationScore = Math.log10((p.citationCount ?? 0) + 1);
  const hasAbstract = p.abstract.length > 40 ? 1 : 0;
  const recency = p.year ? Math.max(0, (p.year - 2010) / 15) : 0;
  return keywordHits * 2 + citationScore + hasAbstract + recency;
}

/**
 * Discover papers from CrossRef + arXiv, dedupe and rank, then cap the list so
 * the whole corpus fits in a single batched AI call.
 */
export async function discoverSources(
  query: string,
  keywords: string[] = [],
  limit = 14
): Promise<Paper[]> {
  const [crossref, arxiv] = await Promise.all([
    searchCrossref(query, 20).catch(() => [] as Paper[]),
    searchArxiv(query, 20).catch(() => [] as Paper[]),
  ]);

  const merged: Paper[] = [];
  const seen = new Set<string>();
  for (const p of [...crossref, ...arxiv]) {
    const key = p.doi ? `doi:${p.doi.toLowerCase()}` : `t:${normalizeTitle(p.title)}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(p);
  }

  const withAbstract = merged.filter((p) => p.abstract.length > 40);
  const pool = withAbstract.length >= 4 ? withAbstract : merged;

  return pool
    .sort((a, b) => scorePaper(b, keywords) - scorePaper(a, keywords))
    .slice(0, limit);
}
