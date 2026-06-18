"use client";

import { type ReactNode } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StepStatus } from "./progress-rail";

export function StepCard({
  index,
  title,
  description,
  status,
  onRetry,
  error,
  children,
}: {
  index: number;
  title: string;
  description?: string;
  status: StepStatus;
  onRetry?: () => void;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {index}
            </span>
            {title}
            {status === "active" && (
              <Loader2 className="size-4 animate-spin text-primary" />
            )}
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {status === "error" && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw /> Retry
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {status === "error" ? (
          <p className="text-sm text-destructive">
            {error || "Something went wrong."}
          </p>
        ) : status === "active" && !children ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
