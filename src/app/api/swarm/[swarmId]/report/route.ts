// src/app/api/swarm/[swarmId]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { processSwarmCompletion } from "@/lib/swarm";

/** POST /api/swarm/[swarmId]/report — manually trigger/re-run swarm intelligence report */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const swarmTask = await db.getSwarmTask(swarmId);

    if (!swarmTask) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Swarm task not found" } }, { status: 404 });
    }

    const submissions = await db.getSwarmSubmissions(swarmId);
    if (submissions.filter((s) => s.submittedAt).length === 0) {
      return NextResponse.json({ error: { code: "NO_SUBMISSIONS", message: "No submissions to process yet" } }, { status: 409 });
    }

    const clusterReport = await processSwarmCompletion(swarmTask, submissions);
    const updated = await db.updateSwarmTask(swarmId, {
      status: "COMPLETED",
      clusterReport,
    });

    return NextResponse.json({ data: { ...updated, submissions } });
  } catch (error) {
    console.error("POST /api/swarm/[swarmId]/report error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to run swarm report" } }, { status: 500 });
  }
}
