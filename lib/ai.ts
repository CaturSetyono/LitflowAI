import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";
import type { z } from "zod";

const MODEL = process.env.OPENROUTER_MODEL || "nex-agi/nex-n2-pro:free";

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  const openrouter = createOpenRouter({ apiKey });
  return openrouter.chat(MODEL);
}

/**
 * Extract the first balanced JSON object/array from a model response.
 * Free models often wrap JSON in prose or ```json fences.
 */
function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Generate JSON validated against a Zod schema. Uses plain text generation
 * (not tool/json mode) because free OpenRouter models often lack structured
 * output support. Retries once with a stricter "JSON only" instruction.
 */
export async function generateJSON<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const model = getModel();

  const attempt = async (extraInstruction = "") => {
    const { text } = await generateText({
      model,
      system: systemPrompt + extraInstruction,
      prompt: userPrompt,
      temperature: 0.4,
    });
    const json = extractJson(text);
    if (!json) throw new Error("No JSON found in model response.");
    return schema.parse(JSON.parse(json));
  };

  try {
    return await attempt();
  } catch {
    // Repair pass: be blunt about the format.
    return await attempt(
      "\n\nIMPORTANT: Respond with ONLY valid minified JSON matching the requested shape. No markdown, no prose, no code fences."
    );
  }
}

/** Streaming text generation, used for the literature review step. */
export function streamTextResponse(systemPrompt: string, userPrompt: string) {
  const model = getModel();
  const result = streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.5,
  });
  return result.toTextStreamResponse();
}
