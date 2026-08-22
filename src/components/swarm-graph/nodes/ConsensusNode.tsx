import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Network, CheckCircle2 } from "lucide-react";

export function ConsensusNode({ data }: { data: any }) {
  const { agreementScore, isReached, status } = data;
  
  const isActive = status === "VERIFYING";
  
  return (
    <div className={`w-[220px] rounded-xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border ${isReached ? "border-[#10B981]/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "border-[#3A3A36] shadow-[0_0_20px_rgba(0,0,0,0.5)]"} overflow-hidden transition-all duration-300`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#8A857B] border-2 border-[#1A1A18]"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isReached ? "bg-[#10B981]/20 text-[#10B981]" : isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#8A857B]/20 text-[#8A857B]"}`}>
              <Network className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wide">
              Consensus
            </span>
          </div>
          {isActive && !isReached && (
            <div className="flex items-center justify-center w-2 h-2">
              <span className="absolute w-2 h-2 rounded-full bg-[#3B82F6] animate-ping opacity-75"></span>
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
            </div>
          )}
        </div>

        <div className="bg-[#141413] rounded-lg border border-[#2C2C29] p-2 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
          {/* Circular progress background */}
          <div className="absolute inset-0 opacity-10" style={{ 
            background: `conic-gradient(${isReached ? '#10B981' : '#3B82F6'} ${agreementScore}%, transparent 0)` 
          }} />
          
          <span className="text-[10px] uppercase font-semibold text-[#B1ADA1] z-10">Agreement</span>
          <div className="flex items-baseline gap-1 z-10">
            <span className={`text-2xl font-mono font-bold ${isReached ? 'text-[#10B981]' : isActive ? 'text-[#F4F3EE]' : 'text-[#8A857B]'}`}>
              {agreementScore || 0}
            </span>
            <span className="text-sm font-mono text-[#8A857B]">%</span>
          </div>
          
          {isReached && (
             <div className="absolute bottom-1 right-1">
               <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
             </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 border-[#1A1A18] ${isReached ? "bg-[#10B981]" : "bg-[#8A857B]"}`}
      />
    </div>
  );
}
