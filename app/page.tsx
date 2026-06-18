"use client";

import { useState } from "react";
import { Sparkles, Search, FlaskConical, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkflowRunner } from "@/components/workflow/workflow-runner";

const EXAMPLES = [
  "AI in Sustainable Agriculture",
  "Blockchain for Healthcare Data Security",
  "Large Language Models in Education",
];

export default function Home() {
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState<string | null>(null);

  const start = () => {
    const t = input.trim();
    if (t.length < 3) return;
    setTopic(t);
  };

  return (
    <main className="brand-canvas min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <header className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft">
            <Sparkles className="size-3.5 text-primary" />
            AI-native research copilot
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            LitFlow AI
          </h1>
          <p className="mt-3 text-lg font-semibold text-primary md:text-xl">
            Discover what hasn&apos;t been researched yet.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Enter a topic and LitFlow AI finds papers, extracts insights, maps
            themes, and discovers research gaps — then generates a structured
            literature review.
          </p>
        </header>

        {!topic ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start()}
                  placeholder="e.g. AI in Sustainable Agriculture"
                  className="h-12 text-base"
                  autoFocus
                />
                <Button
                  onClick={start}
                  disabled={input.trim().length < 3}
                  size="lg"
                  className="shrink-0"
                >
                  <Search /> Discover gaps
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Try:
                </span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="group inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {ex}
                    <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Feature
                icon={<Search className="size-5" />}
                title="Source Discovery"
                text="Trusted papers from CrossRef & arXiv."
              />
              <Feature
                icon={<FlaskConical className="size-5" />}
                title="Gap Discovery Engine"
                text="Finds under-explored areas & contradictions."
              />
              <Feature
                icon={<Lightbulb className="size-5" />}
                title="Future Directions"
                text="Concrete, novel research opportunities."
              />
            </div>
          </div>
        ) : (
          <WorkflowRunner
            topic={topic}
            onReset={() => {
              setTopic(null);
              setInput("");
            }}
          />
        )}

        <footer className="mt-20 text-center text-xs text-muted-foreground">
          LitFlow AI · powered by OpenRouter · sources: CrossRef &amp; arXiv
        </footer>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-accent text-primary">
        {icon}
      </div>
      <p className="mt-3 font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
