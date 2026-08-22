// src/app/api/swarm/[swarmId]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { joinSwarmSchema } from "@/lib/validation";

/** POST /api/swarm/[swarmId]/join — worker joins the swarm */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await req.json();
    const parsed = joinSwarmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Invalid input" } },
        { status: 400 }
      );
    }

    const { workerAddress } = parsed.data;
    const swarmTask = await db.getSwarmTask(swarmId);

    if (!swarmTask) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Swarm task not found" } }, { status: 404 });
    }
    if (swarmTask.status !== "OPEN" && swarmTask.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: { code: "NOT_OPEN", message: "Swarm task is not accepting new workers" } }, { status: 409 });
    }

    const submissions = await db.getSwarmSubmissions(swarmId);

    // Check slots
    if (submissions.length >= swarmTask.maxWorkers) {
      return NextResponse.json({ error: { code: "SLOTS_FULL", message: "All worker slots are filled" } }, { status: 409 });
    }

    // Check if worker already joined
    const existing = await db.getSwarmSubmissionByWorker(swarmId, workerAddress);
    if (existing) {
      return NextResponse.json({ data: existing }); // Idempotent re-join
    }

    // Create submission slot
    const submission = await db.createSwarmSubmission({ swarmId, workerAddress });

    // Update swarm status to IN_PROGRESS if first worker
    if (swarmTask.status === "OPEN") {
      await db.updateSwarmTask(swarmId, { status: "IN_PROGRESS" });
    }

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/join error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to join swarm" } }, { status: 500 });
  }
}
