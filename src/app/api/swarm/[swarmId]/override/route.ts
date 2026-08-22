// src/app/api/swarm/[swarmId]/override/route.ts
// Requester manual approve/reject override for any swarm submission.
// Does NOT remove auto-verification — this is a post-verification overrule layer.
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { processSwarmCompletion } from "@/lib/swarm";

/**
 * POST /api/swarm/[swarmId]/override
 * Body: { submissionId: string, action: "APPROVE" | "REJECT", requesterAddress: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const { submissionId, action, requesterAddress } = body as {
      submissionId: string;
      action: "APPROVE" | "REJECT";
      requesterAddress: string;
    };

    if (!submissionId || !action || !requesterAddress) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "submissionId, action, and requesterAddress are required" } }, { status: 400 });
    }
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "action must be APPROVE or REJECT" } }, { status: 400 });
    }

    const swarmTask = await db.getSwarmTask(swarmId);
    if (!swarmTask) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Swarm task not found" } }, { status: 404 });
    }

    // Only requester can override
    if (swarmTask.requesterAddress.toLowerCase() !== requesterAddress.toLowerCase()) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only the requester can override submissions" } }, { status: 403 });
    }

    const newStatus = action === "APPROVE" ? "VERIFIED" : "REJECTED";
    await db.updateSwarmSubmission(submissionId, { status: newStatus });

    // After override — re-run report if all submitted slots are now resolved
    const allSubmissions = await db.getSwarmSubmissions(swarmId);
    const submittedSubs = allSubmissions.filter((s) => s.submittedAt);
    const resolved = submittedSubs.filter((s) =>
      s.status === "VERIFIED" || s.status === "REJECTED" || s.status === "FLAGGED"
    );

    // Auto-trigger report when all submitted workers have a final verdict
    if (submittedSubs.length > 0 && resolved.length >= submittedSubs.length) {
      await db.updateSwarmTask(swarmId, { status: "PROCESSING" });
      const clusterReport = await processSwarmCompletion(swarmTask, allSubmissions);
      await db.updateSwarmTask(swarmId, { status: "COMPLETED", clusterReport });
    }

    const updatedSubs = await db.getSwarmSubmissions(swarmId);
    const updatedTask = await db.getSwarmTask(swarmId);
    return NextResponse.json({ data: { ...updatedTask, submissions: updatedSubs } });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/override error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to override submission" } }, { status: 500 });
  }
}
