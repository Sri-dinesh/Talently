/**
 * TaskStatusBadge Component
 * Displays styled badge for task status states
 */

import React from "react";
import type { TaskStatus } from "@/types/task";

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING_CHAIN: {
    label: "Locking Escrow",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    border: "border-amber-700/50",
    dot: "bg-amber-400 animate-pulse",
  },
  OPEN: {
    label: "Open",
    bg: "bg-emerald-950/40",
    text: "text-emerald-300",
    border: "border-emerald-700/50",
    dot: "bg-emerald-400",
  },
  PENDING_ACCEPT: {
    label: "Accepting...",
    bg: "bg-sky-950/40",
    text: "text-sky-300",
    border: "border-sky-700/50",
    dot: "bg-sky-400 animate-pulse",
  },
  ACCEPTED: {
    label: "In Progress",
    bg: "bg-blue-950/40",
    text: "text-blue-300",
    border: "border-blue-700/50",
    dot: "bg-blue-400",
  },
  PENDING_SUBMIT: {
    label: "Submitting...",
    bg: "bg-indigo-950/40",
    text: "text-indigo-300",
    border: "border-indigo-700/50",
    dot: "bg-indigo-400 animate-pulse",
  },
  SUBMITTED: {
    label: "Under Review",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    border: "border-purple-700/50",
    dot: "bg-purple-400",
  },
  PENDING_APPROVE: {
    label: "Releasing Funds...",
    bg: "bg-violet-950/40",
    text: "text-violet-300",
    border: "border-violet-700/50",
    dot: "bg-violet-400 animate-pulse",
  },
  APPROVED: {
    label: "Paid Out",
    bg: "bg-teal-950/40",
    text: "text-teal-300",
    border: "border-teal-700/50",
    dot: "bg-teal-400",
  },
  CANCELLED: {
    label: "Cancelled & Refunded",
    bg: "bg-slate-900/60",
    text: "text-slate-400",
    border: "border-slate-800",
    dot: "bg-slate-500",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-950/40",
    text: "text-red-300",
    border: "border-red-800/50",
    dot: "bg-red-500",
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
