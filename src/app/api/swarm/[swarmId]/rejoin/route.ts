// src/app/api/swarm/[swarmId]/rejoin/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

/** POST /api/swarm/[swarmId]/rejoin — worker resets / rejoins their submission slot to re-execute */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const { workerAddress } = body as { workerAddress: string };

    if (!workerAddress) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "workerAddress is required" } },
        { status: 400 }
      );
    }

    const swarmTask = await db.getSwarmTask(swarmId);
    if (!swarmTask) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Swarm task not found" } }, { status: 404 });
    }

    let submission = await db.getSwarmSubmissionByWorker(swarmId, workerAddress);
    if (!submission) {
      // If not yet joined, create new slot
      const submissions = await db.getSwarmSubmissions(swarmId);
      if (submissions.length >= swarmTask.maxWorkers) {
        return NextResponse.json({ error: { code: "SLOTS_FULL", message: "All worker slots are filled" } }, { status: 409 });
      }
      submission = await db.createSwarmSubmission({ swarmId, workerAddress });
    } else {
      // If already joined, reset status back to EXECUTING for fresh submission
      submission = await db.updateSwarmSubmission(submission.id, {
        status: "EXECUTING",
        resultText: null,
        resultSeverity: null,
        resultAttachmentUrl: null,
        verificationScorecard: null,
        submittedAt: null,
      });
    }

    if (swarmTask.status === "OPEN" || swarmTask.status === "COMPLETED") {
      await db.updateSwarmTask(swarmId, { status: "IN_PROGRESS" });
    }

    const updatedTask = await db.getSwarmTask(swarmId);
    const updatedSubs = await db.getSwarmSubmissions(swarmId);

    return NextResponse.json({
      data: {
        ...updatedTask,
        submissions: updatedSubs,
        mySubmission: submission,
      },
    });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/rejoin error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to rejoin swarm" } }, { status: 500 });
  }
}
