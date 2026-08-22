/**
 * TaskCard Component
 * Renders an individual micro-task card with reward, category, skills, and status
 */

import React from "react";
import Link from "next/link";
import { Clock, Tag } from "lucide-react";
import type { Task } from "@/types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { formatMon, formatAddress } from "@/lib/utils";

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group block p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-purple-600/60 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-purple-950/30"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {task.category && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {task.category}
            </span>
          )}
          <TaskStatusBadge status={task.status} />
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            {formatMon(task.rewardWei)} MON
          </div>
          {task.estimatedMinutes && (
            <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>~{task.estimatedMinutes} mins</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1 mb-1.5 text-base">
        {task.title}
      </h3>

      <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {task.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Tag className="w-3 h-3 text-slate-600 shrink-0" />
          <div className="flex gap-1 overflow-hidden">
            {task.skills?.length > 0 ? (
              task.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-slate-600">Open to all</span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-slate-400">
          by {formatAddress(task.requesterAddress)}
        </div>
      </div>
    </Link>
  );
}
