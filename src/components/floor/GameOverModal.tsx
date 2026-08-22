"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Coins, RotateCcw, ShieldCheck, Flame, Skull, Sparkles } from "lucide-react";
import { FloorPlayer } from "@/types/floor";

interface GameOverModalProps {
  isOpen: boolean;
  winner?: FloorPlayer;
  bountyMon: string;
  players: FloorPlayer[];
  onPlayAgain: () => void;
}

export function GameOverModal({
  isOpen,
  winner,
  bountyMon,
  players,
  onPlayAgain,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95 duration-300">
      <div className="bg-[#121211] border-2 border-[#EAB308]/60 rounded-3xl max-w-xl w-full p-8 shadow-[0_0_80px_rgba(234,179,8,0.25)] flex flex-col items-center text-center gap-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#EAB308]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Victory Icon & Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-[#EAB308]/20 border-2 border-[#EAB308]/50 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-bounce">
            <Trophy className="w-8 h-8 text-[#EAB308]" />
          </div>
          <h2 className="text-2xl font-black text-[#F4F3EE] uppercase tracking-wider">
            Match Terminated · Sole Survivor
          </h2>
          <p className="text-xs text-[#8A857B]">
            The matrix has resolved. Only the most cunning survived the deception.
          </p>
        </div>

        {/* Winner Showcase Card */}
        {winner && (
          <div className="w-full bg-[#1A1A18] border border-[#EAB308]/40 rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-md ring-2 ring-[#EAB308]"
                style={{ backgroundColor: winner.avatarColor }}
              >
                {winner.displayName.slice(0, 1)}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono text-[#EAB308] uppercase font-bold tracking-wider">
                  Champion & Survivor
                </span>
                <h3 className="text-base font-bold text-[#F4F3EE]">
                  {winner.displayName}
                </h3>
                <span className="text-xs font-mono text-[#8A857B]">
                  {winner.score} Total Score · {winner.trustScore}% Final Trust
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-[#8A857B] uppercase font-bold">Reward Won</span>
              <div className="flex items-center gap-1.5 text-base font-black text-[#EAB308]">
                <Coins className="w-4 h-4" />
                <span>{bountyMon}</span>
              </div>
            </div>
          </div>
        )}

        {/* Final Match Leaderboard */}
        <div className="w-full flex flex-col gap-2 text-left">
          <span className="text-[10px] font-mono font-bold text-[#8A857B] uppercase tracking-wider">
            Final Standings
          </span>
          <div className="bg-[#0A0A0A] border border-[#2C2C29] rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#141413] text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#8A857B] font-bold w-4">#{idx + 1}</span>
                  <span className="font-bold text-[#F4F3EE]">{player.displayName}</span>
                  {!player.isAlive && (
                    <span className="text-[9px] text-[#EF4444] bg-[#EF4444]/10 px-1 rounded">
                      Fallen
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[#10B981]">{player.trustScore}% Trust</span>
                  <span className="font-bold text-[#F4F3EE]">{player.score} PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <Link
            href="/floor"
            className="py-3 rounded-xl bg-[#1E1E1C] hover:bg-[#2C2C29] text-[#B1ADA1] hover:text-white font-bold text-xs uppercase tracking-wide border border-[#2C2C29] transition-all flex items-center justify-center gap-2"
          >
            Lobby Menu
          </Link>
          <button
            onClick={onPlayAgain}
            className="py-3 rounded-xl bg-[#C15F3C] hover:bg-[#D97757] text-white font-black text-xs uppercase tracking-wide transition-all shadow-[0_0_25px_rgba(193,95,60,0.4)] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
