// src/app/api/floor/games/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createFloorGame, filterGameForPlayer } from "@/lib/floorEngine";

/**
 * GET /api/floor/games
 * List active games / lobbies
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("address") || undefined;
    const allGames = await db.listFloorGames();

    // Return filtered view of games
    const summaries = allGames.map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      round: g.round,
      maxRounds: g.maxRounds,
      maxPlayers: g.maxPlayers,
      activePlayersCount: g.players.filter((p) => p.isAlive).length,
      totalPlayersCount: g.players.length,
      bountyMon: g.bountyMon,
      isPrivate: g.isPrivate,
      roomCode: g.roomCode,
      creatorAddress: g.creatorAddress,
      winnerName: g.winnerName,
      createdAt: g.createdAt,
    }));

    return NextResponse.json({ data: summaries });
  } catch (error) {
    console.error("GET /api/floor/games error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to list floor games" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/floor/games
 * Create a new Floor Is Lying game arena
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorAddress, title, isPrivate, roomCode } = body as {
      creatorAddress: string;
      title?: string;
      isPrivate?: boolean;
      roomCode?: string;
    };

    if (!creatorAddress) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "creatorAddress is required" } },
        { status: 400 }
      );
    }

    const game = createFloorGame(creatorAddress, title, isPrivate, roomCode);
    await db.createFloorGame(game);

    const filtered = filterGameForPlayer(game, creatorAddress);
    return NextResponse.json({ data: filtered }, { status: 201 });
  } catch (error) {
    console.error("POST /api/floor/games error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create floor game" } },
      { status: 500 }
    );
  }
}
