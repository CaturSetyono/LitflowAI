import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai";
import { insightsSchema, type Paper } from "@/lib/schemas";
import { insightPrompts } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topic, papers } = (await req.json()) as {
      topic?: string;
      papers?: Paper[];
    };
    if (!topic || !Array.isArray(papers) || papers.length === 0) {
      return NextResponse.json(
        { error: "Missing topic or papers." },
        { status: 400 }
      );
    }
    const { system, user } = insightPrompts(topic.trim(), papers);
    const { insights } = await generateJSON(insightsSchema, system, user);
    return NextResponse.json({ insights });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Insight extraction failed.",
      },
      { status: 500 }
    );
  }
}
