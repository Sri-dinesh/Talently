/**
 * TaskStatusBadge Component - Claude Brand Palette
 * Styled with warm Crail, Sage, Amber, and Cloudy stone palettes
 */

import React from "react";
import type { TaskStatus } from "@/types/task";

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING_CHAIN: {
    label: "Locking Escrow",
    bg: "bg-[#C15F3C]/10 dark:bg-[#D97757]/15",
    text: "text-[#C15F3C] dark:text-[#D97757]",
    border: "border-[#C15F3C]/25 dark:border-[#D97757]/30",
    dot: "bg-[#C15F3C] dark:bg-[#D97757] animate-pulse",
  },
  OPEN: {
    label: "Open for Claim",
    bg: "bg-[#2E7D32]/10 dark:bg-[#4CAF50]/15",
    text: "text-[#2E7D32] dark:text-[#4CAF50]",
    border: "border-[#2E7D32]/25 dark:border-[#4CAF50]/30",
    dot: "bg-[#2E7D32] dark:bg-[#4CAF50]",
  },
  PENDING_ACCEPT: {
    label: "Claiming...",
    bg: "bg-[#C26C00]/10 dark:bg-[#F59E0B]/15",
    text: "text-[#C26C00] dark:text-[#F59E0B]",
    border: "border-[#C26C00]/25 dark:border-[#F59E0B]/30",
    dot: "bg-[#C26C00] dark:bg-[#F59E0B] animate-pulse",
  },
  ACCEPTED: {
    label: "In Progress",
    bg: "bg-[#C26C00]/10 dark:bg-[#F59E0B]/15",
    text: "text-[#C26C00] dark:text-[#F59E0B]",
    border: "border-[#C26C00]/25 dark:border-[#F59E0B]/30",
    dot: "bg-[#C26C00] dark:bg-[#F59E0B]",
  },
  PENDING_SUBMIT: {
    label: "Submitting...",
    bg: "bg-[#C15F3C]/10 dark:bg-[#D97757]/15",
    text: "text-[#C15F3C] dark:text-[#D97757]",
    border: "border-[#C15F3C]/25 dark:border-[#D97757]/30",
    dot: "bg-[#C15F3C] dark:bg-[#D97757] animate-pulse",
  },
  SUBMITTED: {
    label: "Under Review",
    bg: "bg-[#B1ADA1]/15 dark:bg-[#B1ADA1]/20",
    text: "text-[#1A1A18] dark:text-[#F4F3EE]",
    border: "border-[#B1ADA1]/30 dark:border-[#B1ADA1]/40",
    dot: "bg-[#B1ADA1]",
  },
  PENDING_APPROVE: {
    label: "Releasing Funds...",
    bg: "bg-[#2E7D32]/10 dark:bg-[#4CAF50]/15",
    text: "text-[#2E7D32] dark:text-[#4CAF50]",
    border: "border-[#2E7D32]/25 dark:border-[#4CAF50]/30",
    dot: "bg-[#2E7D32] dark:bg-[#4CAF50] animate-pulse",
  },
  APPROVED: {
    label: "Paid Out",
    bg: "bg-[#2E7D32]/10 dark:bg-[#4CAF50]/15",
    text: "text-[#2E7D32] dark:text-[#4CAF50]",
    border: "border-[#2E7D32]/25 dark:border-[#4CAF50]/30",
    dot: "bg-[#2E7D32] dark:bg-[#4CAF50]",
  },
  CANCELLED: {
    label: "Cancelled & Refunded",
    bg: "bg-[#F4F3EE] dark:bg-[#242422]",
    text: "text-[#8A857B] dark:text-[#7D7970]",
    border: "border-[#E8E6DF] dark:border-[#3A3A36]",
    dot: "bg-[#B1ADA1]",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-[#C15F3C]/10 dark:bg-[#D97757]/15",
    text: "text-[#C15F3C] dark:text-[#D97757]",
    border: "border-[#C15F3C]/25 dark:border-[#D97757]/30",
    dot: "bg-[#C15F3C] dark:bg-[#D97757]",
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
