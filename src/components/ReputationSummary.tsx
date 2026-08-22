/**
 * ReputationSummary Component - Claude Brand Theme
 * Displays on-chain reputation score, approval rate, and task statistics in warm cards
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
      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-1 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8A857B] dark:text-[#7D7970] font-medium">
            Tasks Approved
          </span>
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-[#4CAF50]" />
        </div>
        <div className="text-2xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE] font-mono">{approved}</div>
        <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">Verified on Monad contract</div>
      </div>

      {/* Approval Rate */}
      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-1 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8A857B] dark:text-[#7D7970] font-medium">Approval Rate</span>
          <TrendingUp className="w-4 h-4 text-[#C15F3C] dark:text-[#D97757]" />
        </div>
        <div className="text-2xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE] font-mono">
          {completed > 0 ? `${approvalRate}%` : "100%"}
        </div>
        <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">
          {completed > 0 ? `${approved} of ${completed} tasks approved` : "New provider score"}
        </div>
      </div>

      {/* Trust Rating Tier */}
      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-1 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8A857B] dark:text-[#7D7970] font-medium">Trust Tier</span>
          <ShieldCheck className="w-4 h-4 text-[#2E7D32] dark:text-[#4CAF50]" />
        </div>
        <div className="text-base font-semibold text-[#2E7D32] dark:text-[#4CAF50] flex items-center gap-1.5 pt-1">
          <Award className="w-4 h-4" />
          <span>
            {approved >= 10
              ? "Verified Expert"
              : approved >= 3
              ? "Trusted Provider"
              : "Active Contributor"}
          </span>
        </div>
        <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">On-chain score verified</div>
      </div>
    </div>
  );
}
