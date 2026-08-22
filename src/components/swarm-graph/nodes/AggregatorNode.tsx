import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Zap } from "lucide-react";

export function AggregatorNode({ data }: { data: any }) {
  const { receivedCount, expectedCount } = data;
  
  const isComplete = receivedCount > 0 && receivedCount === expectedCount;
  
  return (
    <div className={`w-[200px] rounded-xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border ${isComplete ? "border-[#836EF9]/50" : "border-[#3A3A36]"} shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#8A857B] border-2 border-[#1A1A18]"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isComplete ? "bg-[#836EF9]/20 text-[#836EF9]" : "bg-[#8A857B]/20 text-[#8A857B]"}`}>
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wide">
              Aggregator
            </span>
          </div>
          {receivedCount > 0 && !isComplete && (
            <div className="flex items-center justify-center w-2 h-2">
              <span className="absolute w-2 h-2 rounded-full bg-[#836EF9] animate-ping opacity-75"></span>
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#836EF9]"></span>
            </div>
          )}
        </div>

        <div className="bg-[#141413] rounded-lg border border-[#2C2C29] p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-semibold text-[#B1ADA1]">Evidence Packets</span>
            <span className="text-[10px] font-mono font-bold text-[#F4F3EE]">
              {receivedCount || 0} / {expectedCount || 0}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#2C2C29] rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-[#836EF9] transition-all duration-500" 
              style={{ width: `${expectedCount > 0 ? ((receivedCount || 0) / expectedCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 border-[#1A1A18] ${isComplete ? "bg-[#836EF9]" : "bg-[#8A857B]"}`}
      />
    </div>
  );
}
