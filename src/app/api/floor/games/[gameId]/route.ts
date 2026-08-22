// src/app/api/floor/games/[gameId]/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { filterGameForPlayer, simulateBotTurns } from "@/lib/floorEngine";

/**
 * GET /api/floor/games/[gameId]?address=0x...
 * Fetch current filtered game state (and runs server-side autonomous simulation ticks)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("address") || undefined;

    let game = await db.getFloorGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Game not found" } },
        { status: 404 }
      );
    }

    // If game is active, periodically run bot decision tick (e.g., if >3.5s elapsed since last update)
    if (game.status === "IN_PROGRESS") {
      const lastUpdate = new Date(game.updatedAt).getTime();
      const now = Date.now();
      if (now - lastUpdate > 3500) {
        game = simulateBotTurns(game);
        await db.updateFloorGame(game.id, game);
      }
    }

    const filtered = filterGameForPlayer(game, userAddress);
    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error("GET /api/floor/games/[gameId] error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch floor game" } },
      { status: 500 }
    );
  }
}
