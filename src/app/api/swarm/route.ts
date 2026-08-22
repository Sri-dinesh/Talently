// src/app/api/swarm/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createSwarmTaskSchema } from "@/lib/validation";
import { classifyTask } from "@/lib/opencode";
import type { SwarmStatus } from "@/types/swarm";

/** GET /api/swarm — list swarm tasks */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as SwarmStatus | null;
    const requesterAddress = searchParams.get("requesterAddress")?.toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const tasks = await db.getSwarmTasks({
      status: status || undefined,
      requesterAddress: requesterAddress || undefined,
      limit,
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("GET /api/swarm error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to fetch swarm tasks" } }, { status: 500 });
  }
}

/** POST /api/swarm — create a new swarm task */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSwarmTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Invalid input" } },
        { status: 400 }
      );
    }

    const { title, description, category, skills, requirements, rewardWeiPerWorker, estimatedMinutes, maxWorkers, requesterAddress } = parsed.data;

    // AI auto-classify if requirements not provided
    let finalRequirements = requirements;
    let finalCategory = category;
    let finalSkills = skills;
    let finalEstimatedMinutes = estimatedMinutes;

    if (!finalRequirements.length || !finalCategory) {
      const classified = await classifyTask(description).catch(() => null);
      if (classified) {
        finalCategory = finalCategory || classified.category;
        finalSkills = finalSkills.length ? finalSkills : classified.skills;
        finalEstimatedMinutes = finalEstimatedMinutes ?? classified.estimatedMinutes;
        if (!finalRequirements.length) finalRequirements = classified.requirements;
      }
    }

    const task = await db.createSwarmTask({
      title,
      description,
      category: finalCategory || "Testing",
      skills: finalSkills,
      requirements: finalRequirements,
      rewardWeiPerWorker,
      estimatedMinutes: finalEstimatedMinutes,
      maxWorkers,
      requesterAddress,
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/swarm error:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to create swarm task" } }, { status: 500 });
  }
}
