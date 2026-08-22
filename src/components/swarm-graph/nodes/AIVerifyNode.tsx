import React from "react";
import { Handle, Position } from "@xyflow/react";
import { BrainCircuit, ShieldCheck, AlertTriangle } from "lucide-react";

export function AIVerifyNode({ data }: { data: any }) {
  const { isProcessing, confidence, status } = data;
  
  const isComplete = status === "COMPLETED";
  const hasIssue = status === "FLAGGED";
  
  return (
    <div className={`w-[240px] rounded-xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border ${hasIssue ? "border-[#EF4444]/50" : isComplete ? "border-[#10B981]/50" : "border-[#3A3A36]"} shadow-[0_0_25px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#8A857B] border-2 border-[#1A1A18]"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${hasIssue ? "bg-[#EF4444]/20 text-[#EF4444]" : isComplete ? "bg-[#10B981]/20 text-[#10B981]" : isProcessing ? "bg-[#C15F3C]/20 text-[#C15F3C]" : "bg-[#8A857B]/20 text-[#8A857B]"}`}>
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wide">
              AI Verification
            </span>
          </div>
          {isProcessing && (
             <div className="flex items-center gap-1">
               <span className="w-1 h-1 rounded-full bg-[#C15F3C] animate-bounce" style={{ animationDelay: "0ms" }} />
               <span className="w-1 h-1 rounded-full bg-[#C15F3C] animate-bounce" style={{ animationDelay: "150ms" }} />
               <span className="w-1 h-1 rounded-full bg-[#C15F3C] animate-bounce" style={{ animationDelay: "300ms" }} />
             </div>
          )}
        </div>

        <div className="bg-[#141413] rounded-lg border border-[#2C2C29] p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-semibold text-[#B1ADA1]">Confidence Score</span>
            <span className={`text-[10px] font-mono font-bold ${confidence > 90 ? "text-[#10B981]" : confidence > 70 ? "text-[#F59E0B]" : "text-[#8A857B]"}`}>
              {confidence ? `${confidence}%` : "---"}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 pt-2 border-t border-[#2C2C29]">
            {isComplete && !hasIssue ? (
              <>
                <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                <span className="text-[10px] text-[#10B981] font-medium uppercase">All checks passed</span>
              </>
            ) : hasIssue ? (
              <>
                <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                <span className="text-[10px] text-[#EF4444] font-medium uppercase">Anomalies detected</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-3 h-3 text-[#8A857B]" />
                <span className="text-[10px] text-[#8A857B] font-medium uppercase">Awaiting evidence...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 border-[#1A1A18] ${hasIssue ? "bg-[#EF4444]" : isComplete ? "bg-[#10B981]" : "bg-[#8A857B]"}`}
      />
    </div>
  );
}
