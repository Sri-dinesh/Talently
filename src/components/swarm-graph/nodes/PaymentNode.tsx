import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Coins, Zap, CheckCircle2 } from "lucide-react";

export function PaymentNode({ data }: { data: any }) {
  const { totalPayout, recipientsCount, status } = data;
  
  const isComplete = status === "SETTLED";
  const isProcessing = status === "PROCESSING";
  
  return (
    <div className={`w-[260px] rounded-xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border ${isComplete ? "border-[#F59E0B]/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]" : "border-[#3A3A36] shadow-[0_0_20px_rgba(0,0,0,0.5)]"} overflow-hidden transition-all duration-300`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#8A857B] border-2 border-[#1A1A18]"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isComplete ? "bg-[#F59E0B]/20 text-[#F59E0B]" : isProcessing ? "bg-[#836EF9]/20 text-[#836EF9]" : "bg-[#8A857B]/20 text-[#8A857B]"}`}>
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wide">
              Escrow Settlement
            </span>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#836EF9] animate-pulse" />
              <span className="text-[9px] uppercase font-bold text-[#836EF9]">Txing</span>
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              <span className="text-[9px] uppercase font-bold text-[#10B981]">0-conf</span>
            </div>
          )}
        </div>

        <div className="bg-[#141413] rounded-lg border border-[#2C2C29] p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-[#B1ADA1]">Total Distributed</span>
            <span className={`text-lg font-mono font-bold ${isComplete ? "text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-[#F4F3EE]"}`}>
              {totalPayout || "0.0000"} MON
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-[#2C2C29]">
            <span className="text-[9px] uppercase font-semibold text-[#B1ADA1]">Recipients</span>
            <span className="text-xs font-mono font-bold text-[#F4F3EE]">{recipientsCount || 0} Nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
