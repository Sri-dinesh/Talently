// src/lib/opencode.ts

export interface ClassifyResult {
  category: "Technical" | "Design" | "Knowledge" | "Testing" | "Social" | "Local";
  skills: string[];
  estimatedMinutes: number;
  requirements: string[]; // 3-5 explicit acceptance criteria checkboxes
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
              "Extract structured metadata and 3 to 5 explicit acceptance criteria requirements for verification. " +
              "Respond with ONLY a JSON object matching exactly this shape, no prose, no markdown fences: " +
              '{"category": "Technical"|"Design"|"Knowledge"|"Testing"|"Social"|"Local", ' +
              '"skills": string[], "estimatedMinutes": number, "requirements": string[]}',
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

    // Defensive validation
    const category = [
      "Technical",
      "Design",
      "Knowledge",
      "Testing",
      "Social",
      "Local",
    ].includes(parsed.category)
      ? parsed.category
      : "Testing";

    return {
      category,
      skills: Array.isArray(parsed.skills) ? parsed.skills : ["QA", "Testing"],
      estimatedMinutes: Number(parsed.estimatedMinutes) || 10,
      requirements: Array.isArray(parsed.requirements) && parsed.requirements.length > 0
        ? parsed.requirements
        : [
            "Execute task per instructions",
            "Provide clear findings and reproduction notes",
            "Attach verification proof / screenshot",
          ],
    };
  } catch {
    return null;
  }
}
