// src/app/api/tasks/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { verifySubmission } from "@/lib/verification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await db.getTask(id);

    if (!task) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    if (!task.resultText) {
      return NextResponse.json(
        { error: { code: "NO_SUBMISSION", message: "Task has no submission to verify" } },
        { status: 400 }
      );
    }

    const verificationScorecard = await verifySubmission(task, {
      resultText: task.resultText,
      resultSeverity: task.resultSeverity,
      resultAttachmentUrl: task.resultAttachmentUrl,
      acceptedAt: task.acceptedAt,
      submittedAt: task.submittedAt || new Date().toISOString(),
    });

    const updatedTask = await db.updateTask(id, {
      verificationScorecard,
    });

    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    console.error("POST /api/tasks/[id]/verify error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to verify task" } },
      { status: 500 }
    );
  }
}
