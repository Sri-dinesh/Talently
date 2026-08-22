"use client";

import React from "react";
import { Skull, Quote } from "lucide-react";
import { GraveyardEntry } from "@/types/floor";

interface GraveyardFeedProps {
  graveyard: GraveyardEntry[];
}

export function GraveyardFeed({ graveyard }: GraveyardFeedProps) {
  if (graveyard.length === 0) {
    return (
      <div className="bg-[#121211] border border-[#2C2C29] rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center gap-2 border-b border-[#2C2C29] pb-2">
          <Skull className="w-4 h-4 text-[#8A857B]" />
          <h3 className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wider">
            Graveyard of Fallen Nodes
          </h3>
        </div>
        <p className="text-xs text-[#8A857B] italic py-2 text-center">
          No casualties yet. All 8 nodes are currently navigating the floor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121211] border border-[#2C2C29] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#2C2C29] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center">
            <Skull className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wider">
              Graveyard of Fallen Nodes
            </h3>
            <p className="text-[10px] text-[#8A857B]">
              Memorial of players eliminated by lethal floor traps.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
          {graveyard.length} Eliminated
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {graveyard.map((entry) => (
          <div
            key={entry.id}
            className="bg-[#181816] border border-[#2C2C29] rounded-xl p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="text-xs font-bold text-[#F4F3EE]">
                  {entry.playerName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded border border-[#EF4444]/20">
                Fell on {entry.tileId} ({entry.causeOfDeath})
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-[#B1ADA1] italic bg-[#0A0A0A] p-2 rounded-lg border border-[#242422]">
              <Quote className="w-3 h-3 text-[#8A857B] shrink-0 mt-0.5" />
              <p className="leading-snug">{entry.lastWords}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
