// src/app/api/swarm/[swarmId]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { submitSwarmResultSchema } from "@/lib/validation";
import { verifySubmission } from "@/lib/verification";
import { processSwarmCompletion } from "@/lib/swarm";

/** POST /api/swarm/[swarmId]/submit — worker submits result, triggers 4-layer verification */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const parsed = submitSwarmResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Invalid input" } },
        { status: 400 }
      );
    }

    const { workerAddress, resultText, resultSeverity, resultAttachmentUrl } = parsed.data;
    const swarmTask = await db.getSwarmTask(swarmId);

    if (!swarmTask) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Swarm task not found" } }, { status: 404 });
    }

    // Find the worker's submission slot
    const submission = await db.getSwarmSubmissionByWorker(swarmId, workerAddress);
    if (!submission) {
      return NextResponse.json({ error: { code: "NOT_JOINED", message: "Worker has not joined this swarm. Join first." } }, { status: 409 });
    }
    if (submission.status !== "EXECUTING") {
      return NextResponse.json({ error: { code: "ALREADY_SUBMITTED", message: "Worker has already submitted for this swarm" } }, { status: 409 });
    }

    const submittedAt = new Date().toISOString();

    // Run 4-layer verification engine on this submission
    // Re-use existing task-like structure for the verifySubmission call
    const taskLike = {
      ...swarmTask,
      id: swarmId,
      onChainId: null,
      rewardWei: swarmTask.rewardWeiPerWorker,
      status: "ACCEPTED" as const,
      requesterAddress: swarmTask.requesterAddress,
      providerAddress: workerAddress,
      resultText: null,
      resultSeverity: null,
      resultAttachmentUrl: null,
      verificationScorecard: null,
      createTxHash: null,
      acceptTxHash: null,
      submitTxHash: null,
      approveTxHash: null,
      acceptedAt: submission.acceptedAt,
      submittedAt,
    };

    let scorecard: import("@/types/verification").VerificationScorecard;
    try {
      scorecard = await verifySubmission(taskLike, {
        resultText,
        resultSeverity: resultSeverity || null,
        resultAttachmentUrl: resultAttachmentUrl || null,
        acceptedAt: submission.acceptedAt,
        submittedAt,
      });
    } catch (err) {
      console.error("AI Verification Failed, falling back to manual review:", err);
      scorecard = {
        verdict: "REVIEW",
        compositeScore: 50,
        requirementsScore: 50,
        requirementsMet: 1,
        requirementsTotal: 1,
        evidenceScore: 50,
        qualityScore: 50,
        anomalyFlags: ["AI_OFFLINE"],
        completionTimeSeconds: 30,
        explanation: "AI verification engine unavailable. Requires manual review.",
        criteriaBreakdown: [],
        evaluatedAt: new Date().toISOString(),
      };
    }

    const newStatus =
      scorecard.verdict === "PASS" ? "VERIFIED"
      : scorecard.verdict === "FAIL" ? "REJECTED"
      : "SUBMITTED";

    // Update submission with result and scorecard
    const updatedSub = await db.updateSwarmSubmission(submission.id, {
      status: newStatus,
      resultText,
      resultSeverity: resultSeverity || null,
      resultAttachmentUrl: resultAttachmentUrl || null,
      verificationScorecard: scorecard,
      submittedAt,
    });

    // Check if all slots have submitted — if so, trigger swarm completion
    const allSubmissions = await db.getSwarmSubmissions(swarmId);
    const submittedCount = allSubmissions.filter((s) => s.submittedAt).length;

    if (submittedCount >= swarmTask.maxWorkers) {
      // All workers done — run swarm intelligence pipeline
      await db.updateSwarmTask(swarmId, { status: "PROCESSING" });
      const clusterReport = await processSwarmCompletion(swarmTask, allSubmissions);
      await db.updateSwarmTask(swarmId, { status: "COMPLETED", clusterReport });
    }

    return NextResponse.json({ data: updatedSub });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/submit error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to submit swarm result" } }, { status: 500 });
  }
}
