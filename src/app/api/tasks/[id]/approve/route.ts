// src/app/api/tasks/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.updateTask(id, {
      status: "PENDING_APPROVE",
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("POST /api/tasks/[id]/approve error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to set approval state" } },
      { status: 500 }
    );
  }
}
