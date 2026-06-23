// Ported from lib/sources/{crossref,arxiv,index}.ts.
// Browser fetches: CrossRef is CORS-enabled (Access-Control-Allow-Origin: *);
// arXiv is best-effort and switched to https so the iframe CSP connect-src allows it.
// The custom User-Agent header is dropped (browsers forbid setting it).

const CROSSREF_MAILTO = "litflow@example.com";

/** Strip JATS/XML tags that CrossRef sometimes wraps abstracts in. */
function cleanAbstract(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<jats:[^>]*>/gi, "")
    .replace(/<\/jats:[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchCrossref(query, rows = 20) {
  const url =
    "https://api.crossref.org/works?" +
    new URLSearchParams({
      query,
      rows: String(rows),
      select: "DOI,title,abstract,author,is-referenced-by-count,issued,URL",
      sort: "relevance",
      mailto: CROSSREF_MAILTO,
    });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`CrossRef request failed: ${res.status}`);
  const data = await res.json();
  const items = data?.message?.items ?? [];

  return items.map((it, idx) => {
    const year = it.issued?.["date-parts"]?.[0]?.[0] ?? null;
    const authors =
      (it.author || [])
        .map((a) => [a.given, a.family].filter(Boolean).join(" ").trim())
        .filter(Boolean) ?? [];
    return {
      id: it.DOI ? `cr-${it.DOI}` : `cr-${idx}`,
      title: it.title?.[0]?.replace(/\s+/g, " ").trim() ?? "Untitled",
      authors,
      abstract: cleanAbstract(it.abstract),
      year: typeof year === "number" ? year : null,
      citationCount: it["is-referenced-by-count"] ?? null,
      source: "crossref",
      url: it.URL ?? (it.DOI ? `https://doi.org/${it.DOI}` : null),
      doi: it.DOI ?? null,
    };
  });
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : null;
}

/** Query the arXiv Atom API and parse entries without a heavy XML dependency. */
export async function searchArxiv(query, max = 20) {
  const url =
    "https://export.arxiv.org/api/query?" +
    new URLSearchParams({
      search_query: `all:${query}`,
      start: "0",
      max_results: String(max),
      sortBy: "relevance",
      sortOrder: "descending",
    });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`arXiv request failed: ${res.status}`);
  const xml = await res.text();

  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((entry, idx) => {
    const idRaw = tag(entry, "id") ?? "";
    const published = tag(entry, "published");
    const year = published ? Number(published.slice(0, 4)) : null;
    const authors = [
      ...entry.matchAll(
        /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g
      ),
    ].map((m) => decode(m[1]));
    return {
      id: idRaw ? `arxiv-${idRaw.split("/abs/")[1] ?? idx}` : `arxiv-${idx}`,
      title: tag(entry, "title") ?? "Untitled",
      authors,
      abstract: tag(entry, "summary") ?? "",
      year: Number.isFinite(year) ? year : null,
      citationCount: null,
      source: "arxiv",
      url: idRaw || null,
      doi: tag(entry, "arxiv:doi"),
    };
  });
}

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scorePaper(p, keywords) {
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
export async function discoverSources(query, keywords = [], limit = 10) {
  const [crossref, arxiv] = await Promise.all([
    searchCrossref(query, 20).catch(() => []),
    searchArxiv(query, 20).catch(() => []),
  ]);

  const merged = [];
  const seen = new Set();
  for (const p of [...crossref, ...arxiv]) {
    const key = p.doi
      ? `doi:${p.doi.toLowerCase()}`
      : `t:${normalizeTitle(p.title)}`;
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
