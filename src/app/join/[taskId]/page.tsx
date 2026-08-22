/**
 * QR Join Landing Page
 * /join/[taskId]
 * Mobile-first, minimal chrome, high conversion view for live demo phone testers
 */

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Zap,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { useAcceptTask } from "@/hooks/useAcceptTask";
import { useSubmitResult } from "@/hooks/useSubmitResult";
import { formatMon, formatAddress } from "@/lib/utils";
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
      setLoading(true);
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const json = await res.json();
        setTask(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTask();
    const interval = setInterval(fetchTask, 3000);
    return () => clearInterval(interval);
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-xs text-slate-400">Loading task from Monad Testnet...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <h2 className="text-lg font-bold text-white">Task Not Available</h2>
        <Link
          href="/tasks"
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
        >
          Explore Other Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-2 px-1 space-y-5">
      {/* Mobile Header Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/30 border border-purple-900/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs text-white">Human API</span>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Main Action Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="space-y-1.5">
          {task.category && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {task.category}
            </span>
          )}
          <h1 className="text-xl font-bold text-white">{task.title}</h1>
        </div>

        {/* Reward Big Pill */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-700/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
              Earn on Completion
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {formatMon(task.rewardWei)} MON
            </div>
          </div>
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>~{task.estimatedMinutes}m</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Instructions
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {/* State Dependent Actions */}
        <div className="pt-2">
          {!isConnected ? (
            <div className="space-y-3 text-center">
              <p className="text-xs text-slate-400">
                Connect your mobile wallet to accept and earn {formatMon(task.rewardWei)} MON
              </p>
              <div className="flex justify-center">
                <WalletConnectButton />
              </div>
            </div>
          ) : task.status === "OPEN" ? (
            <div className="space-y-3">
              {acceptError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
                  {acceptError}
                </div>
              )}
              <button
                onClick={handleAccept}
                disabled={acceptState !== "idle"}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {acceptState !== "idle" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Assigning to your wallet...</span>
                  </>
                ) : (
                  <>
                    <span>Accept Task Now</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : task.status === "ACCEPTED" && isAssignedProvider ? (
            <form onSubmit={handleSubmitResult} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Severity Level
                </label>
                <select
                  value={resultSeverity}
                  onChange={(e) =>
                    setResultSeverity(e.target.value as "Low" | "Medium" | "High")
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Low">Low — Minor Bug</option>
                  <option value="Medium">Medium — Moderate Issue</option>
                  <option value="High">High — Critical Blocker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Findings / Output <span className="text-purple-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Enter your test findings or result..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs resize-none"
                />
              </div>

              {submitError && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitState !== "idle" || !resultText.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitState !== "idle" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Monad...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Claim Reward</span>
                  </>
                )}
              </button>
            </form>
          ) : task.status === "SUBMITTED" ? (
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-purple-300 mx-auto" />
              <div className="text-xs font-bold text-white">Result Submitted!</div>
              <div className="text-[11px] text-slate-300">
                Awaiting requester approval for escrow release.
              </div>
            </div>
          ) : task.status === "APPROVED" ? (
            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-teal-300 mx-auto" />
              <div className="text-xs font-bold text-white">Paid Out On-Chain!</div>
              <div className="text-[11px] text-teal-200">
                {formatMon(task.rewardWei)} MON transferred to provider.
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-2">
              This task is currently {task.status.toLowerCase().replace("_", " ")}.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Link to Full Task */}
      <div className="text-center">
        <Link
          href={`/tasks/${task.id}`}
          className="text-xs text-slate-500 hover:text-purple-400 transition-colors"
        >
          View Full Desktop Details →
        </Link>
      </div>
    </div>
  );
}
