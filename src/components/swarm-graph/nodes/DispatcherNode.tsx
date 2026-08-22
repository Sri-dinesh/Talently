import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Server, Users, Activity } from "lucide-react";

export function DispatcherNode({ data }: { data: any }) {
  const { maxWorkers, currentWorkers, status } = data;
  
  const isActive = status === "OPEN" || status === "IN_PROGRESS";
  
  return (
    <div className="w-[200px] rounded-xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border border-[#3A3A36] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#8A857B] border-2 border-[#1A1A18]"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#8A857B]/20 text-[#8A857B]"}`}>
              <Server className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wide">
              Dispatcher
            </span>
          </div>
          {isActive && (
            <div className="flex items-center justify-center w-2 h-2">
              <span className="absolute w-2 h-2 rounded-full bg-[#3B82F6] animate-ping opacity-75"></span>
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
            </div>
          )}
        </div>

        <div className="bg-[#141413] rounded-lg border border-[#2C2C29] p-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#B1ADA1]">
            <Users className="w-3 h-3" />
            <span className="text-[10px] uppercase font-semibold">Nodes</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#F4F3EE]">
            {currentWorkers || 0} / {maxWorkers || 5}
          </span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-[#3B82F6] border-2 border-[#1A1A18]"
      />
    </div>
  );
}
