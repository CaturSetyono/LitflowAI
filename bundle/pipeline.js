// The LitFlow pipeline — replaces the 5 Next.js API routes. Each step that used
// an API route now calls anna.llm.complete directly (Host API; no key, billed to
// the user's Anna account) or fetches sources straight from the iframe.

import {
  planPrompts,
  insightPrompts,
  gapPrompts,
  reviewPrompts,
} from "./prompts.js";
import { discoverSources } from "./sources.js";
import {
  extractJson,
  coercePlan,
  coerceInsights,
  coerceGaps,
} from "./json.js";

/** Pull the text out of an anna.llm.complete reply, whatever the shape. */
export function textOf(reply) {
  if (reply == null) return "";
  if (typeof reply === "string") return reply;
  if (reply.content && typeof reply.content === "object") {
    if (typeof reply.content.text === "string") return reply.content.text;
  }
  if (typeof reply.text === "string") return reply.text;
  // Some hosts may return content as an array of parts.
  if (Array.isArray(reply.content)) {
    return reply.content
      .map((c) => (c && typeof c.text === "string" ? c.text : ""))
      .join("");
  }
  return "";
}

/**
 * One LLM call that must return JSON. Extracts the first balanced JSON object,
 * coerces it to the expected shape, and retries once with a blunter "JSON only"
 * instruction if parsing fails (mirrors the old lib/ai.ts generateJSON).
 */
async function llmJSON(anna, coerce, system, user, maxTokens, temperature = 0.4) {
  const attempt = async (extra = "") => {
    const reply = await anna.llm.complete({
      messages: [{ role: "user", content: { type: "text", text: user } }],
      systemPrompt: system + extra,
      maxTokens,
      temperature,
    });
    const json = extractJson(textOf(reply));
    if (!json) throw new Error("No JSON found in model response.");
    return coerce(JSON.parse(json));
  };

  try {
    return await attempt();
  } catch {
    return await attempt(
      "\n\nIMPORTANT: Respond with ONLY valid minified JSON matching the requested shape. No markdown, no prose, no code fences."
    );
  }
}

// ── The five steps ──────────────────────────────────────────────────────────

export async function stepPlan(anna, topic) {
  const { system, user } = planPrompts(topic);
  return llmJSON(anna, coercePlan, system, user, 1024);
}

export async function stepSources(topic, plan) {
  const papers = await discoverSources(topic, plan?.keywords ?? [], 10);
  if (!papers.length) {
    throw new Error("No papers found for this topic. Try a broader phrasing.");
  }
  return papers;
}

export async function stepInsights(anna, topic, papers) {
  const { system, user } = insightPrompts(topic, papers);
  const { insights } = await llmJSON(anna, coerceInsights, system, user, 4096);
  return insights;
}

export async function stepGaps(anna, topic, papers, insights) {
  const { system, user } = gapPrompts(topic, papers, insights);
  return llmJSON(anna, coerceGaps, system, user, 2048);
}

export async function stepReview(anna, topic, plan, papers, gaps) {
  const { system, user } = reviewPrompts(topic, plan, papers, gaps);
  const reply = await anna.llm.complete({
    messages: [{ role: "user", content: { type: "text", text: user } }],
    systemPrompt: system,
    maxTokens: 4096,
    temperature: 0.5,
  });
  const text = textOf(reply);
  if (!text.trim()) throw new Error("Empty review returned by the model.");
  return text;
}
