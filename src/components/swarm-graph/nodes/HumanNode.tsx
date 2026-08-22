import React from "react";
import { Handle, Position } from "@xyflow/react";
import { User, CheckCircle2, AlertCircle, Clock, Send, Coins } from "lucide-react";
import { formatAddress } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  EXECUTING: { color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10 border-[#F59E0B]/30", icon: Clock, label: "Executing" },
  SUBMITTED: { color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10 border-[#3B82F6]/30", icon: Send, label: "Submitted" },
  VERIFIED: { color: "text-[#10B981]", bg: "bg-[#10B981]/10 border-[#10B981]/30", icon: CheckCircle2, label: "Verified" },
  PAID_OUT: { color: "text-[#10B981]", bg: "bg-[#10B981]/15 border-[#10B981]/40", icon: Coins, label: "Paid Out" },
  REJECTED: { color: "text-[#EF4444]", bg: "bg-[#EF4444]/10 border-[#EF4444]/30", icon: AlertCircle, label: "Rejected" },
  REFUNDED: { color: "text-[#8A857B]", bg: "bg-[#8A857B]/10 border-[#8A857B]/30", icon: Clock, label: "Refunded" },
  FLAGGED: { color: "text-[#EF4444]", bg: "bg-[#EF4444]/10 border-[#EF4444]/30", icon: AlertCircle, label: "Flagged" },
};

export function HumanNode({ data }: { data: any }) {
  const { address, status } = data;
  
  const config = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.EXECUTING;
  const StatusIcon = config.icon;
  
  const isComplete = status?.toUpperCase() === "VERIFIED" || status?.toUpperCase() === "PAID_OUT";
  
  return (
    <div className={`w-[220px] rounded-xl bg-gradient-to-b from-[#1E1E1C] to-[#121211] border ${isComplete ? "border-[#10B981]/50" : "border-[#3A3A36]"} shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 hover:border-[#8A857B] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] cursor-pointer group`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#8A857B] border-2 border-[#1A1A18]"
      />

      <div className="p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#2C2C29] flex items-center justify-center border border-[#3A3A36]">
            <User className="w-4 h-4 text-[#B1ADA1]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-[#8A857B] uppercase">Node</span>
            <span className="text-sm font-mono font-bold text-[#F4F3EE]">
              {address ? formatAddress(address) : "0x00...000"}
            </span>
          </div>
        </div>

        <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border ${config.bg} ${config.color}`}>
          <span className="text-[10px] uppercase font-bold tracking-wider">{config.label}</span>
          <StatusIcon className="w-3 h-3" />
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 border-[#1A1A18] ${isComplete ? "bg-[#10B981]" : "bg-[#8A857B]"}`}
      />
    </div>
  );
}
