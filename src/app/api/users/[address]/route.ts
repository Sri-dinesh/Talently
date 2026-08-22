// src/app/api/users/[address]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { patchUserSchema } from "@/lib/validation";

/**
 * GET /api/users/[address]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const user = await db.getUser(address);
    const tasksRequested = await db.getTasks({ requesterAddress: address });
    const tasksProvided = await db.getTasks({ providerAddress: address });

    return NextResponse.json({
      data: {
        ...user,
        tasksRequested,
        tasksProvided,
      },
    });
  } catch (error) {
    console.error("GET /api/users/[address] error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch user profile" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[address]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body = await req.json();
    const parsed = patchUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid profile data",
          },
        },
        { status: 400 }
      );
    }

    const { displayName, skills, isAvailable } = parsed.data;
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (skills !== undefined) updateData.skills = skills;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const user = await db.updateUser(address, updateData);

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("PATCH /api/users/[address] error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    );
  }
}
