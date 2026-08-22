// src/app/api/swarm/[swarmId]/refund/route.ts
// Refund unspent escrow (from rejected submissions or cancelled slots) back to the swarm creator.
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { processSwarmCompletion } from "@/lib/swarm";

/**
 * POST /api/swarm/[swarmId]/refund
 * Body: { requesterAddress: string, submissionId?: string, refundAll?: boolean, txHash?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const { requesterAddress, submissionId, refundAll, txHash } = body as {
      requesterAddress: string;
      submissionId?: string;
      refundAll?: boolean;
      txHash?: string;
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
        { error: { code: "FORBIDDEN", message: "Only the swarm creator can claim escrow refunds" } },
        { status: 403 }
      );
    }

    const allSubmissions = await db.getSwarmSubmissions(swarmId);

    // Eligible targets for refund: REJECTED or FLAGGED submissions that are not already REFUNDED
    const targets = allSubmissions.filter((s) => {
      if (submissionId) {
        return s.id === submissionId && (s.status === "REJECTED" || s.status === "FLAGGED");
      }
      if (refundAll) {
        return s.status === "REJECTED" || s.status === "FLAGGED";
      }
      return false;
    });

    const rewardPerWorkerWei = BigInt(swarmTask.rewardWeiPerWorker);
    let totalRefundWei = BigInt(0);

    for (const sub of targets) {
      await db.updateSwarmSubmission(sub.id, {
        status: "REFUNDED",
        refundTxHash: txHash || null,
      });
      totalRefundWei += rewardPerWorkerWei;
    }

    // Cumulative refunded wei on task
    const currentRefunded = BigInt(swarmTask.refundedWei || "0");
    const updatedRefundedWei = (currentRefunded + totalRefundWei).toString();

    await db.updateSwarmTask(swarmId, { refundedWei: updatedRefundedWei });

    // Check if all submitted slots are settled
    const updatedSubs = await db.getSwarmSubmissions(swarmId);
    const submittedSubs = updatedSubs.filter((s) => s.submittedAt);
    const settledSubs = submittedSubs.filter(
      (s) => s.status === "PAID_OUT" || s.status === "REFUNDED" || s.status === "REJECTED"
    );

    if (submittedSubs.length > 0 && settledSubs.length >= submittedSubs.length) {
      const clusterReport = await processSwarmCompletion(swarmTask, updatedSubs);
      await db.updateSwarmTask(swarmId, {
        status: "COMPLETED",
        clusterReport,
        refundedWei: updatedRefundedWei,
      });
    }

    const refreshedTask = await db.getSwarmTask(swarmId);
    const finalSubs = await db.getSwarmSubmissions(swarmId);

    return NextResponse.json({
      data: {
        ...refreshedTask,
        submissions: finalSubs,
        refundedCount: targets.length,
        refundedWei: updatedRefundedWei,
      },
    });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/refund error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to process escrow refund" } },
      { status: 500 }
    );
  }
}
