// src/app/api/tasks/[id]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { submitResultSchema } from "@/lib/validation";
import { verifySubmission } from "@/lib/verification";

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
    const existingTask = await db.getTask(id);

    const submittedAt = new Date().toISOString();

    // Run 4-Layer Verification Engine
    let verificationScorecard = null;
    if (existingTask) {
      try {
        verificationScorecard = await verifySubmission(existingTask, {
          resultText,
          resultSeverity,
          resultAttachmentUrl,
          acceptedAt: existingTask.acceptedAt,
          submittedAt,
        });
      } catch (err) {
        console.warn("[Verification Engine] Execution error during submit:", err);
      }
    }

    const task = await db.updateTask(id, {
      resultText,
      resultSeverity: resultSeverity || null,
      resultAttachmentUrl: resultAttachmentUrl || null,
      verificationScorecard,
      submittedAt,
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
