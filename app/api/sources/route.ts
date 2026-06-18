import { NextResponse } from "next/server";
import { discoverSources } from "@/lib/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topic, keywords } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Missing topic." }, { status: 400 });
    }
    const query = topic.trim();
    const kw = Array.isArray(keywords) ? keywords.map(String) : [];
    const papers = await discoverSources(query, kw);
    if (papers.length === 0) {
      return NextResponse.json(
        { error: "No academic sources found for this topic." },
        { status: 404 }
      );
    }
    return NextResponse.json({ papers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Source discovery failed." },
      { status: 500 }
    );
  }
}
