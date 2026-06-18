import type { Paper } from "../schemas";

function decode(s: string): string {
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

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : null;
}

/**
 * Query the arXiv Atom API and parse entries without a heavy XML dependency.
 */
export async function searchArxiv(
  query: string,
  max = 20
): Promise<Paper[]> {
  const url =
    "http://export.arxiv.org/api/query?" +
    new URLSearchParams({
      search_query: `all:${query}`,
      start: "0",
      max_results: String(max),
      sortBy: "relevance",
      sortOrder: "descending",
    });

  const res = await fetch(url, {
    headers: { "User-Agent": "LitFlowAI/0.1" },
  });
  if (!res.ok) {
    throw new Error(`arXiv request failed: ${res.status}`);
  }
  const xml = await res.text();

  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((entry, idx): Paper => {
    const idRaw = tag(entry, "id") ?? "";
    const published = tag(entry, "published");
    const year = published ? Number(published.slice(0, 4)) : null;
    const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)].map(
      (m) => decode(m[1])
    );
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
