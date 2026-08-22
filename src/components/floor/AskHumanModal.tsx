"use client";

import React, { useState } from "react";
import { X, HelpCircle, Send, Coins, User } from "lucide-react";
import { FloorPlayer } from "@/types/floor";

interface AskHumanModalProps {
  targetPlayer?: FloorPlayer;
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuery: (targetPlayerId?: string, tileId?: string, bountyAmount?: string) => void;
  disabled?: boolean;
}

export function AskHumanModal({
  targetPlayer,
  isOpen,
  onClose,
  onSubmitQuery,
  disabled,
}: AskHumanModalProps) {
  const [tileId, setTileId] = useState("C3");
  const [bounty, setBounty] = useState("0.01 MON");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitQuery(targetPlayer?.id, tileId, bounty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121211] border-2 border-[#C15F3C]/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(193,95,60,0.2)] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2C2C29] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C15F3C]/20 border border-[#C15F3C]/40 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-[#C15F3C]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F3EE] uppercase tracking-wide">
                Ask Human API Query
              </h3>
              <p className="text-[11px] text-[#8A857B]">
                Offer a micro-bounty to query a human player on tile safety.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1E1E1C] text-[#8A857B] hover:text-white flex items-center justify-center border border-[#2C2C29] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Info */}
        <div className="bg-[#181816] p-3 rounded-xl border border-[#2C2C29] flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#2C2C29] flex items-center justify-center border border-[#3A3A36]">
            <User className="w-4 h-4 text-[#B1ADA1]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8A857B]">Target Node</span>
            <p className="text-xs font-bold text-[#F4F3EE]">
              {targetPlayer ? targetPlayer.displayName : "Public Swarm Broadcast (Any Player)"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8A857B] uppercase">Coordinate to Inquire</label>
            <select
              value={tileId}
              onChange={(e) => setTileId(e.target.value)}
              className="bg-[#0A0A0A] border border-[#2C2C29] rounded-xl p-3 text-sm text-[#F4F3EE] font-mono outline-none focus:border-[#C15F3C]"
            >
              {Array.from({ length: 5 }).flatMap((_, y) =>
                Array.from({ length: 5 }).map((__, x) => {
                  const id = `${String.fromCharCode(65 + x)}${y + 1}`;
                  return <option key={id} value={id}>Tile {id}</option>;
                })
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8A857B] uppercase">Intel Bounty (Offered Reward)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                className="flex-1 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl p-3 text-sm text-[#F4F3EE] font-mono outline-none focus:border-[#C15F3C]"
              />
            </div>
            <span className="text-[10px] text-[#8A857B] font-mono">
              Reward paid upon receiving intelligence packet.
            </span>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="w-full py-3 rounded-xl bg-[#C15F3C] hover:bg-[#D97757] text-white font-bold text-xs tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(193,95,60,0.3)] flex items-center justify-center gap-2 mt-2"
          >
            <Send className="w-4 h-4" />
            Transmit Human Query
          </button>
        </form>
      </div>
    </div>
  );
}
