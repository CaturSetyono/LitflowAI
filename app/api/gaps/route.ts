import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai";
import { gapSchema, type Paper, type Insight } from "@/lib/schemas";
import { gapPrompts } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topic, papers, insights } = (await req.json()) as {
      topic?: string;
      papers?: Paper[];
      insights?: Insight[];
    };
    if (!topic || !Array.isArray(papers) || !Array.isArray(insights)) {
      return NextResponse.json(
        { error: "Missing topic, papers, or insights." },
        { status: 400 }
      );
    }
    const { system, user } = gapPrompts(topic.trim(), papers, insights);
    const gaps = await generateJSON(gapSchema, system, user);
    return NextResponse.json(gaps);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gap discovery failed." },
      { status: 500 }
    );
  }
}
