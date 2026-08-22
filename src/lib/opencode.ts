// src/lib/opencode.ts

export interface ClassifyResult {
  category: "Technical" | "Design" | "Knowledge" | "Testing" | "Social" | "Local";
  skills: string[];
  estimatedMinutes: number;
}

export async function classifyTask(description: string): Promise<ClassifyResult | null> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseUrl =
    process.env.OPENCODE_ZEN_BASE_URL ||
    "https://api.opencode.ai/v1/chat/completions";

  const model =
    process.env.OPENCODE_ZEN_MODEL || "deepseek-v4-flash-free";

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You classify short human-task descriptions for a micro-task marketplace. " +
              "Respond with ONLY a JSON object matching exactly this shape, no prose, no markdown fences: " +
              '{"category": "Technical"|"Design"|"Knowledge"|"Testing"|"Social"|"Local", ' +
              '"skills": string[], "estimatedMinutes": number}',
          },
          { role: "user", content: description },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(5000), // never let a slow AI call stall task creation
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Clean potential markdown fencing if model included it
    const jsonStr = content.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Defensive validation — never trust model output blindly
    if (
      !["Technical", "Design", "Knowledge", "Testing", "Social", "Local"].includes(
        parsed.category
      )
    ) {
      return null;
    }

    return {
      category: parsed.category,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      estimatedMinutes: Number(parsed.estimatedMinutes) || 15,
    };
  } catch {
    return null; // caller MUST fall back to manual category dropdown
  }
}
