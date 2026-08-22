/**
 * Task Detail Page — Claude Brand Theme
 * /tasks/[taskId]
 * State-dependent action views (Accept, Submit Result, Approve & Payout, Cancel & Refund)
 * featuring an interactive 4-stage on-chain escrow stepper.
 */

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  QrCode,
  FileCheck,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAcceptTask } from "@/hooks/useAcceptTask";
import { useSubmitResult } from "@/hooks/useSubmitResult";
import { useApproveTask } from "@/hooks/useApproveTask";
import { useCancelTask } from "@/hooks/useCancelTask";
import { formatMon, formatAddress } from "@/lib/utils";
import type { Task } from "@/types/task";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const { address, isConnected } = useAccount();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Result submission inputs
  const [resultText, setResultText] = useState("");
  const [resultSeverity, setResultSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [resultAttachmentUrl, setResultAttachmentUrl] = useState("");

  // Hooks
  const { acceptTask, state: acceptState, error: acceptError } = useAcceptTask();
  const { submitResult, state: submitState, error: submitError } = useSubmitResult();
  const { approveTask, state: approveState, error: approveError } = useApproveTask();
  const { cancelTask, state: cancelState, error: cancelError } = useCancelTask();

  async function fetchTask() {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        setTask(null);
        return false;
      }
      const json = await res.json();
      setTask(json.data);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    fetchTask().then((found) => {
      if (found) {
        interval = setInterval(fetchTask, 4000);
      }
    });
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId]);

  const userAddress = address?.toLowerCase();
  const isRequester = userAddress && task && task.requesterAddress.toLowerCase() === userAddress;
  const isProvider = userAddress && task && task.providerAddress?.toLowerCase() === userAddress;

  async function handleAccept() {
    if (!task || !task.onChainId || !userAddress) return;
    try {
      await acceptTask({
        taskId: task.id,
        onChainId: task.onChainId,
        providerAddress: userAddress,
      });
      await fetchTask();
    } catch {
      // error in hook
    }
  }

  async function handleSubmitResult(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !task.onChainId) return;
    try {
      await submitResult({
        taskId: task.id,
        onChainId: task.onChainId,
        resultText,
        resultSeverity,
        resultAttachmentUrl: resultAttachmentUrl || undefined,
      });
      await fetchTask();
    } catch {
      // error in hook
    }
  }

  async function handleApprove() {
    if (!task || !task.onChainId) return;
    try {
      await approveTask({
        taskId: task.id,
        onChainId: task.onChainId,
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#C15F3C", "#B1ADA1", "#2E7D32", "#F4F3EE"],
      });
      await fetchTask();
    } catch {
      // error in hook
    }
  }

  async function handleCancel() {
    if (!task || !task.onChainId) return;
    if (!confirm("Are you sure you want to cancel this task and refund the escrow reward?")) return;
    try {
      await cancelTask({
        taskId: task.id,
        onChainId: task.onChainId,
      });
      await fetchTask();
    } catch {
      // error in hook
    }
  }

  // Determine active step (1: Escrow Created, 2: Claimed, 3: Submitted, 4: Approved)
  const currentStep = !task
    ? 1
    : task.status === "APPROVED"
    ? 4
    : task.status === "SUBMITTED" || task.status === "PENDING_APPROVE"
    ? 3
    : task.status === "ACCEPTED" || task.status === "PENDING_SUBMIT"
    ? 2
    : 1;

  if (loading && !task) {
    return (
      <div className="py-20 text-center text-[#8A857B] dark:text-[#7D7970] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C15F3C] dark:text-[#D97757]" />
        <p className="text-sm">Loading task details from Monad...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-[#C15F3C] mx-auto" />
        <h2 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Task Not Found</h2>
        <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
          The requested task could not be located in database or Monad contract.
        </p>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] text-[#1A1A18] dark:text-[#F4F3EE] text-xs font-medium hover:bg-[#ECEAE4] dark:hover:bg-[#2C2C29]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Navigation and Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A857B] dark:text-[#7D7970] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Open Tasks</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/join/${task.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] hover:border-[#C15F3C]/50 text-xs font-medium transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-[#C15F3C]" />
            <span>Mobile Fast-Join</span>
          </Link>

          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      {/* 4-Stage On-Chain Escrow Stepper */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { step: 1, label: "1. Escrow Locked", done: currentStep >= 1 },
            { step: 2, label: "2. Claimed", done: currentStep >= 2 },
            { step: 3, label: "3. Proof Submitted", done: currentStep >= 3 },
            { step: 4, label: "4. MON Released", done: currentStep >= 4 },
          ].map((s) => {
            const isCurrent = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <div key={s.step} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isCompleted
                      ? "bg-[#2E7D32] dark:bg-[#4CAF50]"
                      : isCurrent
                      ? "bg-[#C15F3C] dark:bg-[#D97757]"
                      : "bg-[#E8E6DF] dark:bg-[#2C2C29]"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium block truncate ${
                    isCompleted
                      ? "text-[#2E7D32] dark:text-[#4CAF50]"
                      : isCurrent
                      ? "text-[#C15F3C] dark:text-[#D97757] font-semibold"
                      : "text-[#8A857B] dark:text-[#7D7970]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {task.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                  {task.category}
                </span>
              )}
              {task.onChainId && (
                <span className="text-[11px] font-mono text-[#8A857B] dark:text-[#7D7970] bg-[#FBFBF9] dark:bg-[#181817] px-2 py-0.5 rounded border border-[#E8E6DF] dark:border-[#3A3A36]">
                  On-Chain Task #{task.onChainId.toString()}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE] tracking-tight">
              {task.title}
            </h1>
          </div>

          <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-[#C15F3C]/5 dark:bg-[#D97757]/8 border border-[#C15F3C]/20 dark:border-[#D97757]/25">
            <div className="text-xs text-[#C15F3C] dark:text-[#D97757] font-semibold uppercase tracking-wider">
              Escrow Reward
            </div>
            <div className="text-2xl font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">
              {formatMon(task.rewardWei)} MON
            </div>
            {task.estimatedMinutes && (
              <div className="flex items-center sm:justify-end gap-1 text-xs text-[#8A857B] dark:text-[#7D7970] mt-1">
                <Clock className="w-3.5 h-3.5 text-[#B1ADA1]" />
                <span>~{task.estimatedMinutes}m execution</span>
              </div>
            )}
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider">
            Instructions & Criteria
          </h3>
          <div className="p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] text-[#1A1A18] dark:text-[#F4F3EE] text-sm leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {/* Skill Tags & Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8E6DF] dark:border-[#2C2C29] text-xs">
          <div>
            <span className="text-[#8A857B] dark:text-[#7D7970] block mb-1.5 font-medium">Required Skills:</span>
            <div className="flex flex-wrap gap-1.5">
              {task.skills && task.skills.length > 0 ? (
                task.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] font-medium border border-[#E8E6DF] dark:border-[#3A3A36]"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-[#8A857B] dark:text-[#7D7970]">Open to everyone</span>
              )}
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div>
              <span className="text-[#8A857B] dark:text-[#7D7970]">Requester: </span>
              <Link
                href={`/profile/${task.requesterAddress}`}
                className="text-[#C15F3C] dark:text-[#D97757] hover:underline font-mono"
              >
                {formatAddress(task.requesterAddress)}
              </Link>
            </div>
            {task.providerAddress && (
              <div>
                <span className="text-[#8A857B] dark:text-[#7D7970]">Assigned Provider: </span>
                <Link
                  href={`/profile/${task.providerAddress}`}
                  className="text-[#1A1A18] dark:text-[#F4F3EE] hover:underline font-mono"
                >
                  {formatAddress(task.providerAddress)}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic State Action Panel */}
      <div className="space-y-4">
        {/* State: PENDING_CHAIN */}
        {task.status === "PENDING_CHAIN" && (
          <div className="p-6 rounded-3xl bg-[#C15F3C]/5 border border-[#C15F3C]/20 text-center space-y-2.5">
            <Loader2 className="w-8 h-8 animate-spin text-[#C15F3C] mx-auto" />
            <h3 className="text-base font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
              Locking Escrow Reward on Monad...
            </h3>
            <p className="text-xs text-[#8A857B] dark:text-[#7D7970] max-w-md mx-auto">
              The smart contract transaction has been submitted. As soon as the block confirms, this task will flip to Open.
            </p>
          </div>
        )}

        {/* State: OPEN */}
        {task.status === "OPEN" && (
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 dark:bg-[#4CAF50]/15 flex items-center justify-center text-[#2E7D32] dark:text-[#4CAF50]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                  This Task is Open for Execution
                </h3>
                <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                  Reward of {formatMon(task.rewardWei)} MON is locked safely in escrow.
                </p>
              </div>
            </div>

            {!isConnected ? (
              <div className="pt-2">
                <WalletConnectButton />
              </div>
            ) : isRequester ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E6DF] dark:border-[#2C2C29]">
                <span className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                  You posted this task. Waiting for a human provider to accept.
                </span>
                <button
                  onClick={handleCancel}
                  disabled={cancelState !== "idle"}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C15F3C]/10 hover:bg-[#C15F3C]/20 border border-[#C15F3C]/30 text-[#C15F3C] text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {cancelState !== "idle" ? "Refunding..." : "Cancel & Refund Escrow"}
                </button>
              </div>
            ) : (
              <div className="pt-2">
                {acceptError && (
                  <div className="p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs mb-3">
                    {acceptError}
                  </div>
                )}
                <button
                  onClick={handleAccept}
                  disabled={acceptState !== "idle"}
                  className="w-full py-3.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {acceptState !== "idle" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {acceptState === "awaiting_signature"
                          ? "Sign in Wallet..."
                          : "Assigning on Monad..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Accept Task & Start Execution</span>
                      <Zap className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* State: ACCEPTED */}
        {task.status === "ACCEPTED" && (
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C26C00]/10 dark:bg-[#F59E0B]/15 flex items-center justify-center text-[#C26C00] dark:text-[#F59E0B]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                  Work in Progress
                </h3>
                <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                  Assigned to {formatAddress(task.providerAddress || "")}
                </p>
              </div>
            </div>

            {isProvider ? (
              <form onSubmit={handleSubmitResult} className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29]">
                  <span className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE] uppercase tracking-wider block mb-1">
                    Structured Result Submission
                  </span>
                  <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                    For QA / testing tasks, specify bug severity and clear reproduction notes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">
                    Severity Level (QA / Testing)
                  </label>
                  <select
                    value={resultSeverity}
                    onChange={(e) =>
                      setResultSeverity(e.target.value as "Low" | "Medium" | "High")
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs focus:outline-none focus:border-[#C15F3C]"
                  >
                    <option value="Low">Low — Minor visual glitch or typo</option>
                    <option value="Medium">Medium — Friction in user flow</option>
                    <option value="High">High — Blocker, crash, or broken feature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">
                    Result Description & Findings <span className="text-[#C15F3C]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder="Enter your detailed findings, verified steps, test output, or feedback..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] text-xs focus:outline-none focus:border-[#C15F3C] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">
                    Attachment / Screenshot URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={resultAttachmentUrl}
                    onChange={(e) => setResultAttachmentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] text-xs focus:outline-none focus:border-[#C15F3C]"
                  />
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitState !== "idle" || !resultText.trim()}
                  className="w-full py-3.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitState !== "idle" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {submitState === "awaiting_signature"
                          ? "Sign in Wallet..."
                          : "Submitting on Chain..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Result & Request Approval</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                {isRequester
                  ? "The assigned provider is actively executing this task. Result will appear here once submitted."
                  : "This task has already been accepted by another provider."}
              </p>
            )}
          </div>
        )}

        {/* State: SUBMITTED */}
        {task.status === "SUBMITTED" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 dark:bg-[#D97757]/15 flex items-center justify-center text-[#C15F3C] dark:text-[#D97757]">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                  Result Submitted — Under Review
                </h3>
                <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                  Provider has submitted findings and requested escrow release.
                </p>
              </div>
            </div>

            {/* Result Content Card */}
            <div className="p-5 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3">
              {task.resultSeverity && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C26C00]/10 text-[#C26C00] dark:text-[#F59E0B] text-xs font-medium">
                  <span>Severity: {task.resultSeverity}</span>
                </div>
              )}
              <div className="text-[#1A1A18] dark:text-[#F4F3EE] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {task.resultText}
              </div>
              {task.resultAttachmentUrl && (
                <div className="pt-2">
                  <a
                    href={task.resultAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#C15F3C] dark:text-[#D97757] hover:underline"
                  >
                    <span>View Result Attachment</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {isRequester ? (
              <div className="space-y-3 pt-2">
                {approveError && (
                  <div className="p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs">
                    {approveError}
                  </div>
                )}
                <button
                  onClick={handleApprove}
                  disabled={approveState !== "idle"}
                  className="w-full py-4 rounded-xl bg-[#2E7D32] hover:bg-[#256327] active:scale-[0.985] text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {approveState !== "idle" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {approveState === "awaiting_signature"
                          ? "Sign Approval in Wallet..."
                          : "Releasing Escrow Payout..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Result & Release {formatMon(task.rewardWei)} MON</span>
                    </>
                  )}
                </button>
              </div>
            ) : isProvider ? (
              <p className="text-xs text-[#2E7D32] dark:text-[#4CAF50] font-medium">
                You have submitted your results. Funds will release to your wallet as soon as the requester approves.
              </p>
            ) : null}
          </div>
        )}

        {/* State: APPROVED (Completed) */}
        {task.status === "APPROVED" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#2E7D32]/5 border border-[#2E7D32]/25 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#2E7D32]/15 text-[#2E7D32] dark:text-[#4CAF50] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
              Task Completed & Payout Released!
            </h3>
            <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] max-w-md mx-auto">
              The requester approved the submission and {formatMon(task.rewardWei)} MON was transferred directly to the provider on Monad.
            </p>

            {/* Result Preview */}
            {task.resultText && (
              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-left text-xs text-[#1A1A18] dark:text-[#F4F3EE] max-w-xl mx-auto space-y-1.5 mt-4">
                <div className="font-semibold text-[#2E7D32] dark:text-[#4CAF50]">Accepted Submission:</div>
                <p className="whitespace-pre-wrap leading-relaxed">{task.resultText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Chain Transaction Timeline */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 space-y-3.5 shadow-xs">
        <h3 className="text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#C15F3C]" />
          <span>Monad Testnet Transaction Audit Trail</span>
        </h3>

        <div className="space-y-2 text-xs">
          {task.createTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29]">
              <span className="text-[#8A857B] dark:text-[#7D7970]">Escrow Created (createTask):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.createTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#C15F3C] dark:text-[#D97757] hover:underline flex items-center gap-1"
              >
                <span>{task.createTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {task.acceptTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29]">
              <span className="text-[#8A857B] dark:text-[#7D7970]">Provider Assigned (acceptTask):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.acceptTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#C15F3C] dark:text-[#D97757] hover:underline flex items-center gap-1"
              >
                <span>{task.acceptTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {task.submitTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29]">
              <span className="text-[#8A857B] dark:text-[#7D7970]">Result Checkpoint (submitResult):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.submitTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#C15F3C] dark:text-[#D97757] hover:underline flex items-center gap-1"
              >
                <span>{task.submitTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {task.approveTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29]">
              <span className="text-[#2E7D32] dark:text-[#4CAF50] font-medium">Payout Released (approveTask):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.approveTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#2E7D32] dark:text-[#4CAF50] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{task.approveTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
