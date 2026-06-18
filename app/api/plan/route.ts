import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai";
import { planSchema } from "@/lib/schemas";
import { planPrompts } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Missing topic." }, { status: 400 });
    }
    const { system, user } = planPrompts(topic.trim());
    const plan = await generateJSON(planSchema, system, user);
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Planning failed." },
      { status: 500 }
    );
  }
}
