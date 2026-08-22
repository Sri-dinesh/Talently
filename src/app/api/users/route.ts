// src/app/api/users/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

/**
 * GET /api/users
 * Returns list of active users marked as available for micro-tasks
 */
export async function GET() {
  try {
    const users = await db.getAvailableUsers();
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch available users" } },
      { status: 500 }
    );
  }
}
