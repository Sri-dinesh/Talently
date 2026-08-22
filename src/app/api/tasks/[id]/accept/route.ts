// src/app/api/tasks/[id]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { acceptTaskSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = acceptTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid provider address",
          },
        },
        { status: 400 }
      );
    }

    const { providerAddress } = parsed.data;

    await db.updateUser(providerAddress, {});

    const task = await db.updateTask(id, {
      providerAddress,
      status: "PENDING_ACCEPT",
      acceptedAt: new Date().toISOString(),
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("POST /api/tasks/[id]/accept error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to set task acceptance" } },
      { status: 500 }
    );
  }
}
