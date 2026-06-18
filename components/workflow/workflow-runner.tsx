"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ResearchPlan,
  type Paper,
  type Insight,
  type GapAnalysis,
} from "@/lib/schemas";
import { ProgressRail, type StepInfo, type StepStatus } from "./progress-rail";
import { StepCard } from "./step-card";
import { PapersList } from "./papers-list";
import { GapPanel } from "./gap-panel";
import { ReviewView } from "./review-view";
import { Badge } from "@/components/ui/badge";

type StepKey = "plan" | "sources" | "insights" | "gaps" | "review";

const STEP_LABELS: Record<StepKey, string> = {
  plan: "Planning",
  sources: "Sources",
  insights: "Insights",
  gaps: "Gaps",
  review: "Review",
};

const ORDER: StepKey[] = ["plan", "sources", "insights", "gaps", "review"];

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function WorkflowRunner({
  topic,
  onReset,
}: {
  topic: string;
  onReset: () => void;
}) {
  const [status, setStatus] = useState<Record<StepKey, StepStatus>>({
    plan: "pending",
    sources: "pending",
    insights: "pending",
    gaps: "pending",
    review: "pending",
  });
  const [errors, setErrors] = useState<Partial<Record<StepKey, string>>>({});
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [gaps, setGaps] = useState<GapAnalysis | null>(null);
  const [review, setReview] = useState("");
  const [reviewStreaming, setReviewStreaming] = useState(false);

  const setStep = (key: StepKey, s: StepStatus) =>
    setStatus((prev) => ({ ...prev, [key]: s }));

  const startedRef = useRef(false);

  const runReview = useCallback(
    async (p: ResearchPlan, pp: Paper[], g: GapAnalysis) => {
      setStep("review", "active");
      setReview("");
      setReviewStreaming(true);
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, plan: p, papers: pp, gaps: g }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Review failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setReview(acc);
        }
        setStep("review", "done");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Review failed.";
        setErrors((prev) => ({ ...prev, review: msg }));
        setStep("review", "error");
        toast.error("Literature review failed", { description: msg });
      } finally {
        setReviewStreaming(false);
      }
    },
    [topic]
  );

  // Pipeline runner — runs from a given step using locally-passed prior results.
  const run = useCallback(
    async (from: StepKey) => {
      let p = plan;
      let pp = papers;
      let ins = insights;
      let g = gaps;

      try {
        if (ORDER.indexOf(from) <= 0) {
          setStep("plan", "active");
          setErrors((e) => ({ ...e, plan: undefined }));
          p = await postJSON<ResearchPlan>("/api/plan", { topic });
          setPlan(p);
          setStep("plan", "done");
        }

        if (ORDER.indexOf(from) <= 1) {
          setStep("sources", "active");
          setErrors((e) => ({ ...e, sources: undefined }));
          const r = await postJSON<{ papers: Paper[] }>("/api/sources", {
            topic,
            keywords: p?.keywords ?? [],
          });
          pp = r.papers;
          setPapers(pp);
          setStep("sources", "done");
        }

        if (ORDER.indexOf(from) <= 2) {
          setStep("insights", "active");
          setErrors((e) => ({ ...e, insights: undefined }));
          const r = await postJSON<{ insights: Insight[] }>("/api/insights", {
            topic,
            papers: pp,
          });
          ins = r.insights;
          setInsights(ins);
          setStep("insights", "done");
        }

        if (ORDER.indexOf(from) <= 3) {
          setStep("gaps", "active");
          setErrors((e) => ({ ...e, gaps: undefined }));
          g = await postJSON<GapAnalysis>("/api/gaps", {
            topic,
            papers: pp,
            insights: ins,
          });
          setGaps(g);
          setStep("gaps", "done");
        }

        if (p && pp.length && g) {
          await runReview(p, pp, g);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Step failed.";
        setErrors((prev) => ({ ...prev, [from]: msg }));
        setStep(from, "error");
        toast.error(`${STEP_LABELS[from]} failed`, { description: msg });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, plan, papers, insights, gaps, runReview]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run("plan");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const railSteps: StepInfo[] = ORDER.map((k) => ({
    key: k,
    label: STEP_LABELS[k],
    status: status[k],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Research topic
          </p>
          <h2 className="text-lg font-semibold">{topic}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw /> New topic
        </Button>
      </div>

      <ProgressRail steps={railSteps} />

      <div className="space-y-4">
        <StepCard
          index={1}
          title="Research Planning"
          description="Research questions, keywords, and search strategy"
          status={status.plan}
          error={errors.plan}
          onRetry={() => run("plan")}
        >
          {plan && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Research questions</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {plan.researchQuestions.map((q, i) => (
                    <li key={i}>• {q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Keywords</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {plan.keywords.map((k, i) => (
                    <Badge key={i} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium">Search strategy</p>
                <p className="mt-1 text-muted-foreground">
                  {plan.searchStrategy}
                </p>
              </div>
            </div>
          )}
        </StepCard>

        <StepCard
          index={2}
          title="Source Discovery"
          description="Relevant papers from CrossRef & arXiv"
          status={status.sources}
          error={errors.sources}
          onRetry={() => run("sources")}
        >
          {papers.length > 0 && status.insights === "pending" && (
            <p className="text-sm text-muted-foreground">
              {papers.length} papers found.
            </p>
          )}
        </StepCard>

        <StepCard
          index={3}
          title="Insight Extraction"
          description="Key findings, methodology, and limitations per paper"
          status={status.insights}
          error={errors.insights}
          onRetry={() => run("insights")}
        >
          {papers.length > 0 &&
            (status.insights === "done" || insights.length > 0) && (
              <PapersList papers={papers} insights={insights} />
            )}
        </StepCard>

        <StepCard
          index={4}
          title="Gap Discovery"
          description="Themes, gaps, contradictions, and research opportunities"
          status={status.gaps}
          error={errors.gaps}
          onRetry={() => run("gaps")}
        >
          {gaps && <GapPanel gaps={gaps} />}
        </StepCard>

        <StepCard
          index={5}
          title="Literature Review"
          description="A structured, citation-grounded review"
          status={status.review}
          error={errors.review}
          onRetry={() =>
            plan && papers.length && gaps && runReview(plan, papers, gaps)
          }
        >
          {(review || reviewStreaming) && (
            <ReviewView markdown={review} streaming={reviewStreaming} />
          )}
        </StepCard>
      </div>
    </div>
  );
}
