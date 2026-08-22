// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createTaskSchema } from "@/lib/validation";
import type { TaskStatus } from "@/types/task";

/**
 * GET /api/tasks
 * Filterable list of tasks (by status, category, skill, requester, provider)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const category = searchParams.get("category");
    const skill = searchParams.get("skill");
    const requesterAddress = searchParams.get("requesterAddress")?.toLowerCase();
    const providerAddress = searchParams.get("providerAddress")?.toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const tasks = await db.getTasks({
      status: status || undefined,
      category: category || undefined,
      skill: skill || undefined,
      requesterAddress: requesterAddress || undefined,
      providerAddress: providerAddress || undefined,
      limit,
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch tasks" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Optimistic task creation (Step a)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid task input",
          },
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      skills,
      rewardWei,
      estimatedMinutes,
      requesterAddress,
    } = parsed.data;

    const task = await db.createTask({
      title,
      description,
      category: category || "Technical",
      skills: skills || [],
      rewardWei,
      estimatedMinutes: estimatedMinutes || 15,
      requesterAddress,
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create task" } },
      { status: 500 }
    );
  }
}
