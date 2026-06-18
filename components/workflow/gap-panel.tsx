"use client";

import { Lightbulb, TrendingDown, TrendingUp, Split, Combine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GapAnalysis } from "@/lib/schemas";

function GapList({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  tone?: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <span className={tone}>{icon}</span>
        {title}
      </h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-muted-foreground">
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GapPanel({ gaps }: { gaps: GapAnalysis }) {
  return (
    <div className="space-y-5">
      {gaps.themes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold">Research themes</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {gaps.themes.map((t, i) => (
              <Badge key={i} variant="secondary" title={t.description}>
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <GapList
          title="Over-researched"
          items={gaps.overResearched}
          icon={<TrendingUp className="size-4" />}
          tone="text-muted-foreground"
        />
        <GapList
          title="Under-explored"
          items={gaps.underExplored}
          icon={<TrendingDown className="size-4" />}
          tone="text-primary"
        />
        <GapList
          title="Contradictory findings"
          items={gaps.contradictions}
          icon={<Split className="size-4" />}
          tone="text-destructive"
        />
        <GapList
          title="Missing combinations"
          items={gaps.missingCombinations}
          icon={<Combine className="size-4" />}
          tone="text-[#9f53eb]"
        />
      </div>

      {gaps.opportunities.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-primary" />
            Research opportunities
          </h4>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {gaps.opportunities.map((o, i) => (
              <Card
                key={i}
                className="rounded-2xl border-primary/25 bg-primary/[0.04] shadow-none"
              >
                <CardContent className="space-y-1.5 p-4">
                  <p className="font-bold leading-snug text-foreground">
                    {o.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{o.rationale}</p>
                  {o.expectedContributions.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {o.expectedContributions.map((c, j) => (
                        <li key={j}>↳ {c}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
