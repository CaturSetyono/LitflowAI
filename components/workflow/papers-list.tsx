"use client";

import { ExternalLink, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Paper, Insight } from "@/lib/schemas";

export function PapersList({
  papers,
  insights,
}: {
  papers: Paper[];
  insights?: Insight[];
}) {
  const insightById = new Map((insights ?? []).map((i) => [i.id, i]));

  return (
    <ul className="space-y-3">
      {papers.map((p) => {
        const ins = insightById.get(p.id);
        return (
          <li
            key={p.id}
            className="rounded-lg border bg-background/40 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={p.source === "arxiv" ? "accent" : "secondary"}>
                {p.source}
              </Badge>
              {p.year && <Badge variant="outline">{p.year}</Badge>}
              {typeof p.citationCount === "number" && (
                <Badge variant="outline" className="gap-1">
                  <Quote className="size-3" /> {p.citationCount}
                </Badge>
              )}
            </div>
            <h4 className="mt-2 font-medium leading-snug">
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline inline-flex items-start gap-1"
                >
                  {p.title}
                  <ExternalLink className="mt-1 size-3 shrink-0 opacity-60" />
                </a>
              ) : (
                p.title
              )}
            </h4>
            {p.authors.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {p.authors.slice(0, 4).join(", ")}
                {p.authors.length > 4 ? " et al." : ""}
              </p>
            )}
            {ins && (
              <div className="mt-3 space-y-1.5 border-l-2 border-primary/30 pl-3 text-sm">
                {ins.keyFindings.length > 0 && (
                  <p>
                    <span className="font-medium text-foreground">
                      Key findings:{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {ins.keyFindings.join(" ")}
                    </span>
                  </p>
                )}
                {ins.limitations.length > 0 && (
                  <p>
                    <span className="font-medium text-foreground">
                      Limitations:{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {ins.limitations.join(" ")}
                    </span>
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
