import type { Paper } from "../schemas";

/** Strip JATS/XML tags that CrossRef sometimes wraps abstracts in. */
function cleanAbstract(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<jats:[^>]*>/gi, "")
    .replace(/<\/jats:[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface CrossrefItem {
  DOI?: string;
  title?: string[];
  abstract?: string;
  author?: { given?: string; family?: string }[];
  "is-referenced-by-count"?: number;
  issued?: { "date-parts"?: number[][] };
  URL?: string;
}

export async function searchCrossref(
  query: string,
  rows = 20
): Promise<Paper[]> {
  const mailto = process.env.CROSSREF_MAILTO || "litflow@example.com";
  const url =
    "https://api.crossref.org/works?" +
    new URLSearchParams({
      query,
      rows: String(rows),
      select:
        "DOI,title,abstract,author,is-referenced-by-count,issued,URL",
      sort: "relevance",
      mailto,
    });

  const res = await fetch(url, {
    headers: { "User-Agent": `LitFlowAI/0.1 (mailto:${mailto})` },
  });
  if (!res.ok) {
    throw new Error(`CrossRef request failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    message?: { items?: CrossrefItem[] };
  };
  const items = data.message?.items ?? [];

  return items.map((it, idx): Paper => {
    const year = it.issued?.["date-parts"]?.[0]?.[0] ?? null;
    const authors =
      it.author?.map((a) =>
        [a.given, a.family].filter(Boolean).join(" ").trim()
      ).filter(Boolean) ?? [];
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
