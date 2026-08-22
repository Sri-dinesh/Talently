// src/app/api/tasks/[id]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submitResultSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = submitResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid submission data",
          },
        },
        { status: 400 }
      );
    }

    const { resultText, resultSeverity, resultAttachmentUrl } = parsed.data;

    const task = await db.updateTask(id, {
      resultText,
      resultSeverity: resultSeverity || null,
      resultAttachmentUrl: resultAttachmentUrl || null,
      status: "PENDING_SUBMIT",
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("POST /api/tasks/[id]/submit error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to submit result" } },
      { status: 500 }
    );
  }
}
