"use client";

import React from "react";
import { Eye, ShieldAlert, Sparkles, Send, Skull, CheckCircle2, AlertTriangle } from "lucide-react";
import { FloorHint, FloorTileType } from "@/types/floor";

interface IntelDossierProps {
  dossier: FloorHint[];
  onBroadcastClaim: (tileId: string, claimedType: FloorTileType, isBluff: boolean) => void;
  disabled?: boolean;
}

export function IntelDossier({ dossier, onBroadcastClaim, disabled }: IntelDossierProps) {
  return (
    <div className="bg-[#121211] border border-[#2C2C29] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#2C2C29] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#836EF9]/20 border border-[#836EF9]/40 flex items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-[#836EF9]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wider">
              Secret Intel Dossier
            </h3>
            <p className="text-[10px] text-[#8A857B]">
              Confidential sensor scans. Nobody else has this exact map.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#836EF9]/10 text-[#836EF9] border border-[#836EF9]/30">
          {dossier.length} Scans
        </span>
      </div>

      {/* Dossier Cards List */}
      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
        {dossier.map((hint, idx) => {
          const isHazard = hint.perceivedType === "TRAP" || hint.perceivedType === "INSTANT_DEATH";
          const isSafe = hint.perceivedType === "SAFE" || hint.perceivedType === "TREASURE";

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all
                ${hint.isNoise ? "bg-[#EF4444]/5 border-[#EF4444]/30" : "bg-[#1A1A18] border-[#2C2C29]"}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-[#F4F3EE] bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#3A3A36]">
                    {hint.tileId}
                  </span>
                  <div className="flex items-center gap-1">
                    {isHazard ? (
                      <Skull className="w-3.5 h-3.5 text-[#EF4444]" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                    <span className={`text-xs font-bold ${isHazard ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                      {hint.perceivedType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-[#8A857B]">
                  <span>{hint.confidence}% Conf.</span>
                </div>
              </div>

              {hint.isNoise && (
                <div className="flex items-center gap-1 text-[9px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded border border-[#EF4444]/20">
                  <ShieldAlert className="w-3 h-3" />
                  <span>The floor is lying (High glitch likelihood)</span>
                </div>
              )}

              {/* Action Buttons: Tell Truth vs Bluff / Lie */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#2C2C29]">
                <button
                  onClick={() => onBroadcastClaim(hint.tileId, hint.perceivedType, false)}
                  disabled={disabled}
                  className="py-1 px-2 rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] font-bold text-[10px] border border-[#10B981]/30 transition-all flex items-center justify-center gap-1"
                >
                  <Send className="w-2.5 h-2.5" />
                  Broadcast Truth
                </button>
                <button
                  onClick={() => {
                    const opposite: FloorTileType = isHazard ? "SAFE" : "TRAP";
                    onBroadcastClaim(hint.tileId, opposite, true);
                  }}
                  disabled={disabled}
                  className="py-1 px-2 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-bold text-[10px] border border-[#EF4444]/30 transition-all flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Bluff / Lie
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
