/**
 * TaskCard Component - Claude Theme
 * Renders individual micro-task card with reward, category, skills, and status
 */

import React from "react";
import Link from "next/link";
import { Clock, Tag, ArrowUpRight } from "lucide-react";
import type { Task } from "@/types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { formatMon, formatAddress } from "@/lib/utils";

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group block p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/50 dark:hover:border-[#D97757]/50 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Header Row: Category & Status + MON Reward */}
      <div className="flex items-start justify-between gap-4 mb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {task.category && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
              {task.category}
            </span>
          )}
          <TaskStatusBadge status={task.status} />
        </div>

        <div className="text-right shrink-0">
          <div className="text-base font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">
            {formatMon(task.rewardWei)} MON
          </div>
          {task.estimatedMinutes && (
            <div className="flex items-center justify-end gap-1 text-[11px] text-[#8A857B] dark:text-[#7D7970] mt-0.5">
              <Clock className="w-3 h-3 text-[#B1ADA1]" />
              <span>~{task.estimatedMinutes}m</span>
            </div>
          )}
        </div>
      </div>

      {/* Task Title & Description */}
      <div className="space-y-1.5 mb-4">
        <h3 className="font-medium text-[#1A1A18] dark:text-[#F4F3EE] group-hover:text-[#C15F3C] dark:group-hover:text-[#D97757] transition-colors line-clamp-1 text-base flex items-center justify-between">
          <span>{task.title}</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#C15F3C] dark:text-[#D97757] shrink-0" />
        </h3>

        <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] line-clamp-2 leading-relaxed font-normal">
          {task.description}
        </p>
      </div>

      {/* Footer Row: Skills & Requester */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DF] dark:border-[#2C2C29] text-xs text-[#8A857B] dark:text-[#7D7970]">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Tag className="w-3 h-3 text-[#B1ADA1] shrink-0" />
          <div className="flex gap-1 overflow-hidden">
            {task.skills && task.skills.length > 0 ? (
              task.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-1.5 py-0.5 rounded bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] text-[10px]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-[#8A857B] dark:text-[#7D7970] text-[10px]">Open QA</span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-[#8A857B] dark:text-[#7D7970] text-[11px] font-mono">
          by {formatAddress(task.requesterAddress)}
        </div>
      </div>
    </Link>
  );
}
