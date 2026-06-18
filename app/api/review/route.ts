import { NextResponse } from "next/server";
import { streamTextResponse } from "@/lib/ai";
import { reviewPrompts } from "@/lib/prompts";
import type { ResearchPlan, Paper, GapAnalysis } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topic, plan, papers, gaps } = (await req.json()) as {
      topic?: string;
      plan?: ResearchPlan;
      papers?: Paper[];
      gaps?: GapAnalysis;
    };
    if (!topic || !plan || !Array.isArray(papers) || !gaps) {
      return NextResponse.json(
        { error: "Missing data for review generation." },
        { status: 400 }
      );
    }
    const { system, user } = reviewPrompts(topic.trim(), plan, papers, gaps);
    return streamTextResponse(system, user);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review generation failed." },
      { status: 500 }
    );
  }
}
