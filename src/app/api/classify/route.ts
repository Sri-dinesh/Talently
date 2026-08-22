// src/app/api/classify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { classifyTask } from "@/lib/opencode";
import { classifyTaskSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = classifyTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null });
    }

    const result = await classifyTask(parsed.data.description);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("POST /api/classify error:", error);
    // Never fail with 500 — graceful null fallback
    return NextResponse.json({ data: null });
  }
}
