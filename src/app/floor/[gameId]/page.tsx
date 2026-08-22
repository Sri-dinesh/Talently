"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { 
  ArrowLeft, 
  Coins, 
  Clock, 
  ShieldCheck, 
  Skull, 
  Flame, 
  Sparkles, 
  Users, 
  Radio, 
  Loader2, 
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { FilteredFloorGame, FloorPlayer, FloorTileType } from "@/types/floor";
import { FloorGrid } from "@/components/floor/FloorGrid";
import { IntelDossier } from "@/components/floor/IntelDossier";
import { TrustRadar } from "@/components/floor/TrustRadar";
import { CommsHub } from "@/components/floor/CommsHub";
import { GraveyardFeed } from "@/components/floor/GraveyardFeed";
import { AskHumanModal } from "@/components/floor/AskHumanModal";
import { WhisperModal } from "@/components/floor/WhisperModal";
import { GameOverModal } from "@/components/floor/GameOverModal";

export default function FloorArenaPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [game, setGame] = useState<FilteredFloorGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<FloorPlayer | undefined>();
  const [askHumanTarget, setAskHumanTarget] = useState<FloorPlayer | undefined>();
  const [showAskHumanModal, setShowAskHumanModal] = useState(false);
  const [showWhisperModal, setShowWhisperModal] = useState(false);
  const [mode, setMode] = useState<"LIVE" | "SIMULATION">("LIVE");

  const fetchGameState = async () => {
    try {
      const url = `/api/floor/games/${gameId}${address ? `?address=${address}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setGame(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch game state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 2500);
    return () => clearInterval(interval);
  }, [gameId, address]);

  // Execute Action Helper
  const sendAction = async (actionData: any) => {
    if (!game?.myPlayer) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/floor/games/${gameId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...actionData,
          playerId: game.myPlayer.id,
        }),
      });
      const json = await res.json();
      if (json.data?.game) {
        setGame(json.data.game);
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = (tileId: string) => {
    sendAction({ type: "MOVE", targetTileId: tileId });
  };

  const handleClaim = (tileId: string, claimedType: FloorTileType, text?: string) => {
    sendAction({ type: "CLAIM", targetTileId: tileId, claimedType, messageText: text });
  };

  const handleWhisper = (targetPlayerId: string, text: string) => {
    sendAction({ type: "WHISPER", targetPlayerId, messageText: text });
  };

  const handleAskHuman = (targetPlayerId?: string, tileId?: string, bountyAmount?: string) => {
    sendAction({ type: "ASK_HUMAN", targetPlayerId, targetTileId: tileId, bountyAmount });
  };

  const handleGhostBroadcast = (text: string) => {
    sendAction({ type: "GHOST_BROADCAST", messageText: text });
  };

  if (loading && !game) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4 text-[#8A857B]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C15F3C]" />
        <span className="text-sm font-mono tracking-wider">Synchronizing with Monad Grid Arena...</span>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold text-[#F4F3EE]">Arena Not Found</h2>
        <p className="text-xs text-[#8A857B]">This match may have concluded or expired.</p>
        <Link href="/floor" className="py-2 px-5 bg-[#C15F3C] text-white rounded-xl font-bold text-xs uppercase">
          Back to Lobby
        </Link>
      </div>
    );
  }

  const myPlayer = game.myPlayer;
  const isAlive = Boolean(myPlayer?.isAlive);
  const isGhost = Boolean(myPlayer?.isGhost);
  const isGameOver = game.status === "COMPLETED";
  const winner = game.players.find((p) => p.id === game.winnerId);

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-[1400px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121211] border border-[#2C2C29] p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/floor"
            className="w-9 h-9 rounded-xl bg-[#1A1A18] hover:bg-[#2C2C29] text-[#8A857B] hover:text-white flex items-center justify-center border border-[#2C2C29] transition-all"
            title="Leave Match"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[#F4F3EE] uppercase tracking-wide font-mono">
                {game.title}
              </h1>
              {game.roomCode && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#836EF9]/20 text-[#836EF9] border border-[#836EF9]/30">
                  CODE: {game.roomCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8A857B] font-mono">
              Round {game.round} / {game.maxRounds} · 5×5 Matrix · {game.players.filter((p) => p.isAlive).length} Nodes Active
            </p>
          </div>
        </div>

        {/* Center: Live On-Chain vs Swarm Simulation Toggle */}
        <div className="flex items-center bg-[#0A0A0A] p-1 rounded-xl border border-[#242422]">
          <button
            onClick={() => setMode("LIVE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all
              ${mode === "LIVE" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-xs" : "text-[#8A857B] hover:text-white"}
            `}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>LIVE ON-CHAIN</span>
          </button>
          <button
            onClick={() => setMode("SIMULATION")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all
              ${mode === "SIMULATION" ? "bg-[#836EF9]/20 text-[#836EF9] border border-[#836EF9]/40 shadow-xs" : "text-[#8A857B] hover:text-white"}
            `}
          >
            <span className="w-2 h-2 rounded-full bg-[#836EF9]" />
            <span>SWARM SIMULATION</span>
          </button>
        </div>

        {/* Status Indicators: Bounty, Health, Shield, Trust */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-xl text-xs font-mono font-bold text-[#EAB308]">
            <Coins className="w-4 h-4" />
            <span>{game.bountyMon}</span>
          </div>

          {myPlayer && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A18] border border-[#2C2C29] rounded-xl text-xs font-mono">
                <span className="text-[10px] text-[#8A857B]">HP:</span>
                <span className={`font-bold ${myPlayer.hp > 50 ? "text-[#10B981]" : myPlayer.hp > 20 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>
                  {myPlayer.hp}/100
                </span>
                {myPlayer.hasShield && (
                  <span title="Energy Shield Active">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A18] border border-[#2C2C29] rounded-xl text-xs font-mono font-bold text-[#10B981]">
                <Flame className="w-3.5 h-3.5 text-[#10B981]" />
                <span>{myPlayer.trustScore}% Trust</span>
              </div>
            </>
          )}

          <button
            onClick={fetchGameState}
            className="p-2 rounded-xl bg-[#1A1A18] hover:bg-[#2C2C29] text-[#8A857B] hover:text-white border border-[#2C2C29] transition-all"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Telemetry Banner */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono
        ${mode === "LIVE" ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]" : "bg-[#836EF9]/10 border-[#836EF9]/30 text-[#836EF9]"}
      `}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="font-bold">
            {mode === "LIVE"
              ? "⚡ MONAD TESTNET LIVE VERIFICATION: ESCROW LOCKED · 10,000+ TPS · REAL-TIME EVENT STREAM ACTIVE"
              : "🤖 AUTONOMOUS NODE SIMULATION ACTIVE: 7 Autonomous Node Validators executing game theory heuristics"}
          </span>
        </div>
        <span className="text-[10px] text-[#8A857B]">
          {mode === "LIVE" ? "Contract: 0xAecc...3779" : "Autonomous Swarm Engine"}
        </span>
      </div>

      {/* Main 3-Column Tactical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Secret Intel Dossier & Graveyard (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
          <IntelDossier
            dossier={game.myDossier}
            onBroadcastClaim={(tileId, type, isBluff) => handleClaim(tileId, type, isBluff ? "Bluff scan" : "Verified scan")}
            disabled={actionLoading || !isAlive}
          />
          <GraveyardFeed graveyard={game.graveyard} />
        </div>

        {/* Center Column: Interactive 5x5 Cyber Grid (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4 order-1 lg:order-2">
          {/* Player State Alert Banner */}
          {isGhost && (
            <div className="w-full bg-[#EF4444]/15 border-2 border-[#EF4444]/40 rounded-2xl p-4 flex items-center justify-between shadow-lg text-xs font-mono text-[#FCA5A5]">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-[#EF4444]" />
                <div>
                  <span className="font-bold uppercase tracking-wider block">Eliminated · Ghost State Active</span>
                  <span className="text-[10px] opacity-80">
                    You can spectate the match and broadcast 1 anonymous psychic transmission to deceive survivors.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Grid */}
          <FloorGrid
            grid={game.grid as any}
            players={game.players}
            myPlayer={myPlayer}
            myDossier={game.myDossier}
            onMove={handleMove}
            disabled={actionLoading || !isAlive || isGameOver}
          />

          {/* Quick Action Triggers */}
          <div className="flex items-center gap-3 w-full max-w-[560px]">
            <button
              onClick={() => {
                setAskHumanTarget(undefined);
                setShowAskHumanModal(true);
              }}
              disabled={actionLoading || !isAlive || isGameOver}
              className="flex-1 py-3 px-4 rounded-xl bg-[#C15F3C]/15 hover:bg-[#C15F3C]/25 text-[#C15F3C] border border-[#C15F3C]/40 font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Human API (0.01 MON)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Trust Radar & Swarm Comms (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-3">
          <TrustRadar
            players={game.players}
            myPlayer={myPlayer}
            onOpenWhisper={(p) => {
              setWhisperTarget(p);
              setShowWhisperModal(true);
            }}
            onOpenAskHuman={(p) => {
              setAskHumanTarget(p);
              setShowAskHumanModal(true);
            }}
          />

          <CommsHub
            messages={game.messages}
            myPlayer={myPlayer}
            onSendClaim={handleClaim}
            onSendGhostBroadcast={handleGhostBroadcast}
            disabled={actionLoading}
          />
        </div>
      </div>

      {/* Modals */}
      <AskHumanModal
        isOpen={showAskHumanModal}
        targetPlayer={askHumanTarget}
        onClose={() => setShowAskHumanModal(false)}
        onSubmitQuery={handleAskHuman}
        disabled={actionLoading}
      />

      <WhisperModal
        isOpen={showWhisperModal}
        targetPlayer={whisperTarget}
        onClose={() => setShowWhisperModal(false)}
        onSendWhisper={handleWhisper}
        disabled={actionLoading}
      />

      <GameOverModal
        isOpen={isGameOver}
        winner={winner}
        bountyMon={game.bountyMon}
        players={game.players}
        onPlayAgain={() => router.push("/floor")}
      />
    </div>
  );
}
