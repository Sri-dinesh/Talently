/**
 * QR Join Landing Page — Claude Brand Theme
 * /join/[taskId]
 * Mobile-first, minimal chrome, high conversion view for phone testers
 */

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Zap,
} from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { VerificationScorecard } from "@/components/VerificationScorecard";
import { useAcceptTask } from "@/hooks/useAcceptTask";
import { useSubmitResult } from "@/hooks/useSubmitResult";
import { formatMon } from "@/lib/utils";
import type { Task } from "@/types/task";

export default function JoinTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const { address, isConnected } = useAccount();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultText, setResultText] = useState("");
  const [resultSeverity, setResultSeverity] = useState<"Low" | "Medium" | "High">("Medium");

  const { acceptTask, state: acceptState, error: acceptError } = useAcceptTask();
  const { submitResult, state: submitState, error: submitError } = useSubmitResult();

  async function fetchTask() {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const json = await res.json();
        setTask(json.data);
        return true;
      }
      setTask(null);
      return false;
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
        interval = setInterval(fetchTask, 3000);
      }
    });
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId]);

  const userAddress = address?.toLowerCase();
  const isAssignedProvider =
    userAddress && task && task.providerAddress?.toLowerCase() === userAddress;

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
      });
      await fetchTask();
    } catch {
      // error in hook
    }
  }

  if (loading && !task) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C15F3C] dark:text-[#D97757]" />
        <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">Loading task from Monad Testnet...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-[#C15F3C]" />
        <h2 className="text-lg font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Task Not Available</h2>
        <Link
          href="/tasks"
          className="px-4 py-2 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] text-[#1A1A18] dark:text-[#F4F3EE] text-xs font-medium hover:bg-[#ECEAE4]"
        >
          Explore Other Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-2 px-1 space-y-4">
      {/* Mobile Header Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C15F3C] flex items-center justify-center text-white font-serif font-bold text-xs">
            T
          </div>
          <span className="font-semibold text-xs text-[#1A1A18] dark:text-[#F4F3EE]">Talently Mobile</span>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Main Action Card */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 shadow-xs space-y-5">
        <div className="space-y-1.5">
          {task.category && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
              {task.category}
            </span>
          )}
          <h1 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">{task.title}</h1>
        </div>

        {/* Reward Big Pill */}
        <div className="p-4 rounded-2xl bg-[#C15F3C]/5 dark:bg-[#D97757]/8 border border-[#C15F3C]/20 dark:border-[#D97757]/25 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#C15F3C] dark:text-[#D97757] font-semibold uppercase tracking-wider">
              Earn on Completion
            </div>
            <div className="text-2xl font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">
              {formatMon(task.rewardWei)} MON
            </div>
          </div>
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-xs text-[#8A857B] dark:text-[#7D7970]">
              <Clock className="w-3.5 h-3.5 text-[#B1ADA1]" />
              <span>~{task.estimatedMinutes}m</span>
            </div>
          )}
        </div>

        {/* Instructions & Acceptance Criteria */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider">
            Instructions & Scope
          </h3>
          <div className="p-3.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] text-xs text-[#1A1A18] dark:text-[#F4F3EE] leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>

          {task.requirements && task.requirements.length > 0 && (
            <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-1.5">
              <span className="text-[10px] font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider block">
                Required Acceptance Criteria
              </span>
              <div className="space-y-1">
                {task.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-[#1A1A18] dark:text-[#F4F3EE]">
                    <CheckCircle2 className="w-3 h-3 text-[#2E7D32] dark:text-[#4CAF50] shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* State Dependent Actions */}
        <div className="pt-2 space-y-4">
          {!isConnected ? (
            <div className="space-y-3 text-center p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29]">
              <ShieldCheck className="w-5 h-5 text-[#C15F3C] mx-auto" />
              <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                Connect your mobile wallet to accept and earn {formatMon(task.rewardWei)} MON
              </p>
              <div className="flex justify-center">
                <WalletConnectButton />
              </div>
            </div>
          ) : task.status === "OPEN" ? (
            <div className="space-y-3">
              {acceptError && (
                <div className="p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs">
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
                    <span>Assigning to your wallet...</span>
                  </>
                ) : (
                  <>
                    <span>Accept Task Now</span>
                    <Zap className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : task.status === "ACCEPTED" && isAssignedProvider ? (
            <form onSubmit={handleSubmitResult} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1">
                  Severity Level
                </label>
                <select
                  value={resultSeverity}
                  onChange={(e) =>
                    setResultSeverity(e.target.value as "Low" | "Medium" | "High")
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs"
                >
                  <option value="Low">Low — Minor Bug</option>
                  <option value="Medium">Medium — Moderate Issue</option>
                  <option value="High">High — Critical Blocker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1">
                  Findings / Output <span className="text-[#C15F3C]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Enter your test findings or verified result..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs resize-none"
                />
              </div>

              {submitError && (
                <div className="p-2.5 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitState !== "idle" || !resultText.trim()}
                className="w-full py-3.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitState !== "idle" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Monad...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Run Verification</span>
                  </>
                )}
              </button>
            </form>
          ) : task.status === "SUBMITTED" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-[#C15F3C] mx-auto" />
                <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Result Submitted!</div>
                <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">
                  Verification engine has evaluated findings. Awaiting final requester payout release.
                </div>
              </div>

              {task.verificationScorecard && (
                <VerificationScorecard scorecard={task.verificationScorecard} />
              )}
            </div>
          ) : task.status === "APPROVED" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#2E7D32]/10 border border-[#2E7D32]/25 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-[#2E7D32] dark:text-[#4CAF50] mx-auto" />
                <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Paid Out On-Chain!</div>
                <div className="text-[11px] text-[#2E7D32] dark:text-[#4CAF50]">
                  {formatMon(task.rewardWei)} MON transferred to your wallet.
                </div>
              </div>

              {task.verificationScorecard && (
                <VerificationScorecard scorecard={task.verificationScorecard} />
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-[#8A857B] dark:text-[#7D7970] py-2">
              This task is currently {task.status.toLowerCase().replace("_", " ")}.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Link to Full Task */}
      <div className="text-center">
        <Link
          href={`/tasks/${task.id}`}
          className="text-xs text-[#8A857B] dark:text-[#7D7970] hover:text-[#C15F3C] dark:hover:text-[#D97757] transition-colors"
        >
          View Full Desktop Details →
        </Link>
      </div>
    </div>
  );
}
