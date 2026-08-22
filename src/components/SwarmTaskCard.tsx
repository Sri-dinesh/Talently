// src/components/SwarmTaskCard.tsx
"use client";

import Link from "next/link";
import { Users, Clock, CheckCircle2, Loader2 } from "lucide-react";
import type { SwarmTask } from "@/types/swarm";

function formatMon(wei: string): string {
  try {
    const val = Number(BigInt(wei)) / 1e18;
    return val.toFixed(val < 0.01 ? 4 : 2);
  } catch {
    return "0";
  }
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open for Workers", className: "bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-[#C26C00]/10 text-[#C26C00] dark:text-[#F59E0B] border border-[#C26C00]/20" },
  PROCESSING: { label: "Processing Results", className: "bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/20" },
  COMPLETED: { label: "Completed", className: "bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/20" },
  CANCELLED: { label: "Cancelled", className: "bg-[#B1ADA1]/20 text-[#6B665E] border border-[#B1ADA1]/30" },
};

export function SwarmTaskCard({ task, participantCount = 0 }: { task: SwarmTask; participantCount?: number }) {
  const status = STATUS_STYLES[task.status] || STATUS_STYLES["OPEN"];
  const slotsUsed = participantCount;
  const slotsTotal = task.maxWorkers;
  const slotsFraction = slotsUsed / slotsTotal;
  const totalRewardWei = (BigInt(task.rewardWeiPerWorker) * BigInt(slotsTotal)).toString();

  return (
    <Link href={`/swarm/${task.id}`} className="block group">
      <div className="h-full p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/50 dark:hover:border-[#D97757]/40 hover:shadow-md transition-all duration-200">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Swarm badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] text-[10px] font-semibold uppercase tracking-wider border border-[#C15F3C]/20">
              <Users className="w-2.5 h-2.5" />
              Swarm
            </span>
            {task.category && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                {task.category}
              </span>
            )}
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE] leading-snug mb-1 group-hover:text-[#C15F3C] dark:group-hover:text-[#D97757] transition-colors line-clamp-2">
          {task.title}
        </h3>
        <p className="text-[11px] text-[#8A857B] dark:text-[#7D7970] leading-relaxed line-clamp-2 mb-4">
          {task.description}
        </p>

        {/* Worker slots progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-medium mb-1.5">
            <span className="text-[#8A857B] dark:text-[#7D7970] flex items-center gap-1">
              <Users className="w-3 h-3" />
              {slotsUsed}/{slotsTotal} workers joined
            </span>
            <span className="text-[#1A1A18] dark:text-[#F4F3EE]">
              {task.status === "COMPLETED" ? "Full" : `${slotsTotal - slotsUsed} slots left`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#F4F3EE] dark:bg-[#242422] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C15F3C] dark:bg-[#D97757] transition-all duration-500"
              style={{ width: `${Math.min(slotsFraction * 100, 100)}%` }}
            />
          </div>
          {/* Slot dots */}
          <div className="flex gap-1 mt-1.5">
            {Array.from({ length: slotsTotal }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < slotsUsed
                    ? "bg-[#C15F3C] dark:bg-[#D97757]"
                    : "bg-[#E8E6DF] dark:bg-[#2C2C29]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Reward & time */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DF] dark:border-[#2C2C29]">
          <div>
            <div className="text-[10px] text-[#8A857B] dark:text-[#7D7970] font-medium">Per Worker</div>
            <div className="text-base font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">
              {formatMon(task.rewardWeiPerWorker)} MON
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#8A857B] dark:text-[#7D7970] font-medium">Total Pool</div>
            <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE] font-mono">
              {formatMon(totalRewardWei)} MON
            </div>
          </div>
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-[10px] text-[#8A857B] dark:text-[#7D7970]">
              <Clock className="w-3 h-3" />
              <span>~{task.estimatedMinutes}m</span>
            </div>
          )}
        </div>

        {/* Completed: show consensus if available */}
        {task.status === "COMPLETED" && task.clusterReport && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#2E7D32]/5 border border-[#2E7D32]/15 text-[10px]">
            <div className="flex items-center gap-1.5 text-[#2E7D32] dark:text-[#4CAF50] font-semibold mb-0.5">
              <CheckCircle2 className="w-3 h-3" />
              Swarm Report Ready
            </div>
            <div className="text-[#5C5851] dark:text-[#B1ADA1]">
              {task.clusterReport.validCount}/{task.clusterReport.participantCount} valid · {task.clusterReport.consensusScore}% consensus
            </div>
          </div>
        )}

        {task.status === "PROCESSING" && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#C15F3C]/5 border border-[#C15F3C]/15 flex items-center gap-2 text-[10px] text-[#C15F3C] dark:text-[#D97757]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running swarm intelligence engine...
          </div>
        )}

        {/* Skill tags */}
        {task.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#E8E6DF] dark:border-[#2C2C29]">
            {task.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1]"
              >
                {skill}
              </span>
            ))}
            {task.skills.length > 3 && (
              <span className="text-[9px] text-[#8A857B] dark:text-[#7D7970]">+{task.skills.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
