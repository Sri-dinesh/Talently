"use client";

import React from "react";
import { ShieldCheck, Skull, MessageSquare, HelpCircle, Flame } from "lucide-react";
import { FloorPlayer } from "@/types/floor";

interface TrustRadarProps {
  players: FloorPlayer[];
  myPlayer?: FloorPlayer;
  onOpenWhisper: (player: FloorPlayer) => void;
  onOpenAskHuman: (player: FloorPlayer) => void;
}

export function TrustRadar({ players, myPlayer, onOpenWhisper, onOpenAskHuman }: TrustRadarProps) {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-[#121211] border border-[#2C2C29] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#2C2C29] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C15F3C]/20 border border-[#C15F3C]/40 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[#C15F3C]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wider">
              Trust & Reputation Radar
            </h3>
            <p className="text-[10px] text-[#8A857B]">
              Social credibility based on verified truth vs deception.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#8A857B]">
          {players.filter((p) => p.isAlive).length} / {players.length} Alive
        </span>
      </div>

      {/* Players List Table */}
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedPlayers.map((player, idx) => {
          const isMe = myPlayer?.id === player.id;
          const trustColor =
            player.trustScore >= 75
              ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30"
              : player.trustScore >= 45
              ? "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30"
              : "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30";

          return (
            <div
              key={player.id}
              className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all
                ${isMe ? "bg-[#1C1B19] border-[#C15F3C]/40" : "bg-[#161615] border-[#242422]"}
                ${!player.isAlive ? "opacity-60 grayscale-[40%]" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                {/* Left: Rank, Avatar, Name */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#8A857B] w-3">
                    #{idx + 1}
                  </span>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.displayName.slice(0, 1)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold font-mono ${isMe ? "text-[#C15F3C]" : "text-[#F4F3EE]"}`}>
                      {player.displayName}
                    </span>
                    {isMe ? (
                      <span className="text-[9px] font-mono px-1 rounded bg-[#C15F3C]/20 text-[#C15F3C] border border-[#C15F3C]/30">
                        YOU
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[#8A857B]">
                        {player.address ? `${player.address.slice(0, 4)}...${player.address.slice(-2)}` : "Node"}
                      </span>
                    )}
                    {!player.isAlive && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono px-1 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                        <Skull className="w-2.5 h-2.5" /> GHOST
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Trust Score Badge */}
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${trustColor}`}>
                    {player.trustScore}% Trust
                  </div>
                </div>
              </div>

              {/* Status Bar: HP & Score */}
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-[#8A857B]">
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-[9px] text-[#B1ADA1]">HP</span>
                  <div className="flex-1 h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2C2C29]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        player.hp > 50 ? "bg-[#10B981]" : player.hp > 20 ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                      }`}
                      style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px]">{player.hp}/{player.maxHp}</span>
                  {player.hasShield && (
                    <span title="Protected by Shield">
                      <ShieldCheck className="w-3 h-3 text-[#3B82F6]" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[#F4F3EE] font-bold">
                  <span>{player.score} PTS</span>
                </div>
              </div>

              {/* Action Triggers for other alive players */}
              {!isMe && player.isAlive && (
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#242422]">
                  <button
                    onClick={() => onOpenWhisper(player)}
                    className="py-1 px-2 rounded-lg bg-[#1E1E1C] hover:bg-[#2C2C29] text-[#B1ADA1] hover:text-white font-medium text-[10px] border border-[#2C2C29] transition-all flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-2.5 h-2.5 text-[#836EF9]" />
                    Whisper
                  </button>
                  <button
                    onClick={() => onOpenAskHuman(player)}
                    className="py-1 px-2 rounded-lg bg-[#C15F3C]/10 hover:bg-[#C15F3C]/20 text-[#C15F3C] font-medium text-[10px] border border-[#C15F3C]/30 transition-all flex items-center justify-center gap-1"
                  >
                    <HelpCircle className="w-2.5 h-2.5 text-[#C15F3C]" />
                    Ask Human (0.01 MON)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
