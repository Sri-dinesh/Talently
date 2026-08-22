// src/app/api/swarm/[swarmId]/cancel/route.ts
// Requester can cancel/stop a swarm at any point (sets status → CANCELLED).
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

/**
 * POST /api/swarm/[swarmId]/cancel
 * Body: { requesterAddress: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const { requesterAddress } = body as { requesterAddress: string };

    if (!requesterAddress) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "requesterAddress is required" } },
        { status: 400 }
      );
    }

    const swarmTask = await db.getSwarmTask(swarmId);
    if (!swarmTask) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Swarm task not found" } }, { status: 404 });
    }
    if (swarmTask.requesterAddress !== requesterAddress.toLowerCase()) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only the requester can cancel this swarm" } }, { status: 403 });
    }
    if (swarmTask.status === "COMPLETED" || swarmTask.status === "CANCELLED") {
      return NextResponse.json({ error: { code: "INVALID_STATE", message: `Swarm is already ${swarmTask.status.toLowerCase()}` } }, { status: 409 });
    }

    const updated = await db.updateSwarmTask(swarmId, { status: "CANCELLED" });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/cancel error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to cancel swarm" } }, { status: 500 });
  }
}
