import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Sparkles, Clock, Coins } from "lucide-react";

export function TaskNode({ data }: { data: any }) {
  const { title, reward, category, requirements } = data;

  return (
    <div className="w-[300px] rounded-2xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border border-[#3A3A36] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Header */}
      <div className="bg-[#1A1A18] px-4 py-3 border-b border-[#2C2C29] flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold text-[#F4F3EE] tracking-wider uppercase">
          <Sparkles className="w-4 h-4 text-[#C15F3C]" />
          SWARM TASK
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#2E2E2B] text-[#B1ADA1] border border-[#3A3A36]">
          {category || "TASK"}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        <h3 className="text-[#F4F3EE] font-semibold text-sm leading-snug line-clamp-2">
          {title || "Deploy Test Website & Verify Functionality"}
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-[#141413] border border-[#2C2C29] flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#F59E0B]" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#8A857B] uppercase">Reward</span>
              <span className="text-xs font-mono font-bold text-[#F59E0B]">{reward || "0.20"} MON</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#141413] border border-[#2C2C29] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#836EF9]" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#8A857B] uppercase">Requirements</span>
              <span className="text-xs font-bold text-[#836EF9]">{requirements?.length || 0} checks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-[#C15F3C] border-2 border-[#1A1A18]"
      />
    </div>
  );
}
