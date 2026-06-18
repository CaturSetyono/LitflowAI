"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviewView({
  markdown,
  streaming,
}: {
  markdown: string;
  streaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={copy}
          disabled={!markdown}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy markdown"}
        </Button>
      </div>
      <article className="prose-litflow max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
        {streaming && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
        )}
      </article>
    </div>
  );
}
