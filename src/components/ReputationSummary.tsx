/**
 * ReputationSummary Component
 * Displays on-chain reputation score, approval rate, and task statistics
 */

"use client";

import React from "react";
import { ShieldCheck, Award, CheckCircle2, TrendingUp } from "lucide-react";
import type { User } from "@/types/task";

export function ReputationSummary({ user }: { user: User }) {
  const completed = user.tasksCompleted || 0;
  const approved = user.tasksApproved || 0;
  const approvalRate =
    completed > 0 ? Math.round((approved / completed) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Approved Tasks */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Tasks Approved
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-white font-mono">{approved}</div>
        <div className="text-[11px] text-slate-500">Verified on Monad contract</div>
      </div>

      {/* Approval Rate */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Approval Rate</span>
          <TrendingUp className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {completed > 0 ? `${approvalRate}%` : "100%"}
        </div>
        <div className="text-[11px] text-slate-500">
          {completed > 0 ? `${approved} of ${completed} tasks approved` : "New provider score"}
        </div>
      </div>

      {/* Trust Rating Tier */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Trust Tier</span>
          <ShieldCheck className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-base font-bold text-teal-300 flex items-center gap-1.5 pt-1">
          <Award className="w-4 h-4" />
          <span>
            {approved >= 10
              ? "Verified Expert"
              : approved >= 3
              ? "Trusted Provider"
              : "Active Contributor"}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">On-chain score verified</div>
      </div>
    </div>
  );
}
