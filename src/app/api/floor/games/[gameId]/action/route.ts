// src/app/api/floor/games/[gameId]/action/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { executePlayerAction, filterGameForPlayer } from "@/lib/floorEngine";
import { FloorAction } from "@/types/floor";

/**
 * POST /api/floor/games/[gameId]/action
 * Body: FloorAction
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const action = (await req.json()) as FloorAction;

    if (!action || !action.type || !action.playerId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "type and playerId are required" } },
        { status: 400 }
      );
    }

    const game = await db.getFloorGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Game not found" } },
        { status: 404 }
      );
    }

    if (game.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: { code: "GAME_OVER", message: "Match is no longer in progress" } },
        { status: 400 }
      );
    }

    const result = executePlayerAction(game, action);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: "ACTION_REJECTED", message: result.message } },
        { status: 400 }
      );
    }

    await db.updateFloorGame(gameId, result.game);

    const player = result.game.players.find(p => p.id === action.playerId);
    const filtered = filterGameForPlayer(result.game, player?.address);

    return NextResponse.json({
      data: {
        message: result.message,
        game: filtered,
      },
    });
  } catch (error) {
    console.error("POST /api/floor/games/[gameId]/action error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to execute action" } },
      { status: 500 }
    );
  }
}
