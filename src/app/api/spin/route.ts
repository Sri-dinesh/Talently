import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { WHEEL_SEGMENTS, type WheelSegment } from "@/types/roulette";

/**
 * GET /api/spin
 * Returns the wheel configuration and matching live open tasks
 */
export async function GET() {
  try {
    const tasks = await db.getTasks({ status: "OPEN" });
    const swarmTasks = await db.getSwarmTasks();
    const openSwarm = swarmTasks.filter((st) => st.status === "OPEN" || st.status === "IN_PROGRESS");

    return NextResponse.json({
      data: {
        segments: WHEEL_SEGMENTS,
        openTasksCount: tasks.length,
        openSwarmCount: openSwarm.length,
      },
    });
  } catch (error) {
    console.error("GET /api/spin error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to load roulette" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/spin
 * Allocates a random task from the wheel result and creates or maps to a real executable task
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { segmentId, workerAddress } = body as {
      segmentId?: number;
      workerAddress?: string;
    };

    // Pick segment
    const targetSegment =
      typeof segmentId === "number" && segmentId >= 0 && segmentId < WHEEL_SEGMENTS.length
        ? WHEEL_SEGMENTS[segmentId]
        : WHEEL_SEGMENTS[Math.floor(Math.random() * WHEEL_SEGMENTS.length)];

    // Check if there is an existing live open task in that category
    const openTasks = await db.getTasks({ status: "OPEN" });
    const matchingTask = openTasks.find(
      (t) => t.category?.toLowerCase() === targetSegment.category.toLowerCase()
    ) || openTasks[0];

    if (matchingTask) {
      return NextResponse.json({
        data: {
          segment: targetSegment,
          task: matchingTask,
          isLiveTask: true,
          actionUrl: `/tasks/${matchingTask.id}`,
        },
      });
    }

    // Check swarm tasks if segment is Swarm
    if (targetSegment.category === "Swarm") {
      const swarmTasks = await db.getSwarmTasks();
      const openSwarm = swarmTasks.find((s) => s.status === "OPEN" || s.status === "IN_PROGRESS");
      if (openSwarm) {
        return NextResponse.json({
          data: {
            segment: targetSegment,
            task: openSwarm,
            isLiveTask: true,
            isSwarm: true,
            actionUrl: `/swarm/${openSwarm.id}`,
          },
        });
      }
    }

    // Create a live bounty task in memory store so worker can immediately accept & execute it!
    const requester = workerAddress || "0x0000000000000000000000000000000000000000";
    const created = await db.createTask({
      title: targetSegment.sampleTitle,
      description: targetSegment.sampleDescription,
      category: targetSegment.category,
      skills: [targetSegment.category, "Bounty", "Monad Testnet"],
      rewardWei: targetSegment.rewardWei,
      estimatedMinutes: targetSegment.estimatedMinutes,
      requesterAddress: requester,
    });

    // Flip to OPEN for immediate execution
    await db.updateTask(created.id, { status: "OPEN" });
    const liveTask = await db.getTask(created.id);

    return NextResponse.json({
      data: {
        segment: targetSegment,
        task: liveTask,
        isLiveTask: true,
        actionUrl: `/tasks/${created.id}`,
      },
    });
  } catch (error) {
    console.error("POST /api/spin error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to allocate task" } },
      { status: 500 }
    );
  }
}
