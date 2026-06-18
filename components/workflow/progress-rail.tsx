"use client";

import { Check, Loader2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface StepInfo {
  key: string;
  label: string;
  status: StepStatus;
}

function Icon({ status }: { status: StepStatus }) {
  if (status === "done")
    return <Check className="size-4 text-emerald-600" />;
  if (status === "active")
    return <Loader2 className="size-4 animate-spin text-primary" />;
  if (status === "error")
    return <AlertCircle className="size-4 text-destructive" />;
  return <Circle className="size-4 text-muted-foreground/40" />;
}

export function ProgressRail({ steps }: { steps: StepInfo[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              s.status === "active" && "border-primary/40 bg-primary/5",
              s.status === "done" && "border-emerald-500/30 bg-emerald-500/5",
              s.status === "error" && "border-destructive/40 bg-destructive/5"
            )}
          >
            <Icon status={s.status} />
            <span
              className={cn(
                "font-medium",
                s.status === "pending" && "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className="h-px w-4 bg-border" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}
