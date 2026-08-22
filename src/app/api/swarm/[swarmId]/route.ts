// src/app/api/swarm/[swarmId]/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

/** GET /api/swarm/[swarmId] — fetch swarm task with all submissions */
export async function GET(
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
    return NextResponse.json({ data: { ...swarmTask, submissions } });
  } catch (error) {
    console.error("GET /api/swarm/[swarmId] error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to fetch swarm task" } }, { status: 500 });
  }
}
