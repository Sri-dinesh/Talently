// src/app/api/swarm/[swarmId]/payout/route.ts
// Release escrow payout for verified swarm workers (individual or batch).
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { processSwarmCompletion } from "@/lib/swarm";

/**
 * POST /api/swarm/[swarmId]/payout
 * Body: { submissionId?: string, payoutAll?: boolean, requesterAddress: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const { submissionId, payoutAll, requesterAddress, txHash, txHashes } = body as {
      submissionId?: string;
      payoutAll?: boolean;
      requesterAddress: string;
      txHash?: string;
      txHashes?: Record<string, string>;
    };

    if (!requesterAddress) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "requesterAddress is required" } },
        { status: 400 }
      );
    }

    const swarmTask = await db.getSwarmTask(swarmId);
    if (!swarmTask) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Swarm task not found" } },
        { status: 404 }
      );
    }

    if (swarmTask.requesterAddress !== requesterAddress.toLowerCase()) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only the requester can release escrow payouts" } },
        { status: 403 }
      );
    }

    const allSubmissions = await db.getSwarmSubmissions(swarmId);

    // Target which submissions to pay out
    let targets = allSubmissions.filter((s) => {
      if (payoutAll) {
        return s.status === "VERIFIED" || (s.status === "SUBMITTED" && s.submittedAt);
      }
      return s.id === submissionId;
    });

    if (targets.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_TARGETS", message: "No eligible verified submissions to pay out" } },
        { status: 400 }
      );
    }

    // Mark as PAID_OUT, record txHash, and update worker profile statistics
    for (const sub of targets) {
      const subTxHash = (txHashes && txHashes[sub.id]) || txHash || sub.payoutTxHash || null;
      await db.updateSwarmSubmission(sub.id, {
        status: "PAID_OUT",
        payoutTxHash: subTxHash,
      });
      try {
        const workerUser = await db.getUser(sub.workerAddress);
        if (workerUser) {
          await db.updateUser(sub.workerAddress, {
            tasksApproved: (workerUser.tasksApproved || 0) + 1,
            tasksCompleted: (workerUser.tasksCompleted || 0) + 1,
          });
        }
      } catch {
        // non-critical user profile sync
      }
    }

    // Refresh submissions and check if all submitted slots are settled
    const updatedSubs = await db.getSwarmSubmissions(swarmId);
    const submittedSubs = updatedSubs.filter((s) => s.submittedAt);
    const settledSubs = submittedSubs.filter(
      (s) => s.status === "PAID_OUT" || s.status === "REJECTED" || s.status === "FLAGGED"
    );

    if (submittedSubs.length > 0 && settledSubs.length >= submittedSubs.length) {
      await db.updateSwarmTask(swarmId, { status: "PROCESSING" });
      const clusterReport = await processSwarmCompletion(swarmTask, updatedSubs);
      await db.updateSwarmTask(swarmId, { status: "COMPLETED", clusterReport });
    }

    const refreshedTask = await db.getSwarmTask(swarmId);
    const finalSubs = await db.getSwarmSubmissions(swarmId);

    return NextResponse.json({
      data: {
        ...refreshedTask,
        submissions: finalSubs,
        paidOutCount: targets.length,
      },
    });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/payout error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to release escrow payout" } },
      { status: 500 }
    );
  }
}
