/**
 * Task Detail Page
 * /tasks/[taskId]
 * State-dependent action views (Accept, Submit Result, Approve & Payout, Cancel & Refund)
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
  AlertTriangle,
  FileCheck,
  CornerDownRight,
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
  const [showQrModal, setShowQrModal] = useState(false);

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
      setLoading(true);
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Task not found");
      const json = await res.json();
      setTask(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTask();
    const interval = setInterval(fetchTask, 4000);
    return () => clearInterval(interval);
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
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
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

  if (loading && !task) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
        <p className="text-sm">Loading task details from Monad...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Task Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested task could not be located in Postgres or Monad contract.
        </p>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Navigation and Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Open Tasks</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/join/${task.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-300 hover:text-white text-xs font-semibold transition-all hover:bg-purple-900/60"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile QR View</span>
          </Link>

          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {task.category && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {task.category}
                </span>
              )}
              {task.onChainId && (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  On-Chain Task #{task.onChainId.toString()}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {task.title}
            </h1>
          </div>

          <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40">
            <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              Escrow Reward
            </div>
            <div className="text-2xl font-extrabold bg-gradient-to-r from-purple-300 via-indigo-200 to-white bg-clip-text text-transparent font-mono">
              {formatMon(task.rewardWei)} MON
            </div>
            {task.estimatedMinutes && (
              <div className="flex items-center sm:justify-end gap-1 text-xs text-slate-400 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>~{task.estimatedMinutes} mins execution</span>
              </div>
            )}
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Instructions & Criteria
          </h3>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {/* Skill Tags & Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block mb-1 font-medium">Required Skills:</span>
            <div className="flex flex-wrap gap-1.5">
              {task.skills?.length > 0 ? (
                task.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Open to everyone</span>
              )}
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div>
              <span className="text-slate-500">Requester: </span>
              <Link
                href={`/profile/${task.requesterAddress}`}
                className="text-purple-400 hover:underline font-mono"
              >
                {formatAddress(task.requesterAddress)}
              </Link>
            </div>
            {task.providerAddress && (
              <div>
                <span className="text-slate-500">Assigned Provider: </span>
                <Link
                  href={`/profile/${task.providerAddress}`}
                  className="text-indigo-400 hover:underline font-mono"
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
          <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/50 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-amber-200">
              Locking Escrow Reward on Monad...
            </h3>
            <p className="text-xs text-amber-300/80 max-w-md mx-auto">
              The smart contract transaction has been submitted. As soon as the block confirms, this task will flip to Open.
            </p>
          </div>
        )}

        {/* State: OPEN */}
        {task.status === "OPEN" && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  This Task is Open for Execution
                </h3>
                <p className="text-xs text-slate-400">
                  Reward of {formatMon(task.rewardWei)} MON is locked in escrow.
                </p>
              </div>
            </div>

            {!isConnected ? (
              <div className="pt-2">
                <WalletConnectButton />
              </div>
            ) : isRequester ? (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  You posted this task. Waiting for a human provider to accept.
                </span>
                <button
                  onClick={handleCancel}
                  disabled={cancelState !== "idle"}
                  className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {cancelState !== "idle" ? "Refunding..." : "Cancel & Refund Escrow"}
                </button>
              </div>
            ) : (
              <div className="pt-2">
                {acceptError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs mb-3">
                    {acceptError}
                  </div>
                )}
                <button
                  onClick={handleAccept}
                  disabled={acceptState !== "idle"}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* State: ACCEPTED */}
        {task.status === "ACCEPTED" && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Work in Progress
                  </h3>
                  <p className="text-xs text-slate-400">
                    Assigned to {formatAddress(task.providerAddress || "")}
                  </p>
                </div>
              </div>
            </div>

            {isProvider ? (
              <form onSubmit={handleSubmitResult} className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1">
                    Structured Result Submission
                  </span>
                  <p className="text-xs text-slate-400">
                    For QA / testing tasks, specify bug severity and clear reproduction notes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Severity Level (QA / Testing)
                  </label>
                  <select
                    value={resultSeverity}
                    onChange={(e) =>
                      setResultSeverity(e.target.value as "Low" | "Medium" | "High")
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Low">Low — Minor visual glitch or typo</option>
                    <option value="Medium">Medium — Friction in user flow</option>
                    <option value="High">High — Blocker, crash, or broken feature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Result Description & Findings <span className="text-purple-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder="Enter your detailed findings, verified steps, test output, or feedback..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Attachment / Screenshot URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={resultAttachmentUrl}
                    onChange={(e) => setResultAttachmentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitState !== "idle" || !resultText.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
              <p className="text-xs text-slate-400">
                {isRequester
                  ? "The assigned provider is actively executing this task. Result will appear here once submitted."
                  : "This task has already been accepted by another provider."}
              </p>
            )}
          </div>
        )}

        {/* State: SUBMITTED */}
        {task.status === "SUBMITTED" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-purple-900/50 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Result Submitted — Under Review
                </h3>
                <p className="text-xs text-slate-400">
                  Provider has submitted findings and requested escrow release.
                </p>
              </div>
            </div>

            {/* Result Content Card */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              {task.resultSeverity && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <span>Severity: {task.resultSeverity}</span>
                </div>
              )}
              <div className="text-slate-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {task.resultText}
              </div>
              {task.resultAttachmentUrl && (
                <div className="pt-2">
                  <a
                    href={task.resultAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
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
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
                    {approveError}
                  </div>
                )}
                <button
                  onClick={handleApprove}
                  disabled={approveState !== "idle"}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {approveState !== "idle" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {approveState === "awaiting_signature"
                          ? "Sign Approval in Wallet..."
                          : "Releasing Escrow Payout..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Approve Result & Release {formatMon(task.rewardWei)} MON</span>
                    </>
                  )}
                </button>
              </div>
            ) : isProvider ? (
              <p className="text-xs text-purple-300">
                You have submitted your results. Funds will release to your wallet as soon as the requester clicks Approve.
              </p>
            ) : null}
          </div>
        )}

        {/* State: APPROVED (Completed) */}
        {task.status === "APPROVED" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-slate-950 border border-teal-800/50 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Task Completed & Payout Released!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              The requester approved the submission and {formatMon(task.rewardWei)} MON was transferred directly to the provider on Monad.
            </p>

            {/* Result Preview */}
            {task.resultText && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300 max-w-xl mx-auto space-y-2 mt-4">
                <div className="font-semibold text-teal-400">Accepted Submission:</div>
                <p className="whitespace-pre-wrap">{task.resultText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Chain Transaction Timeline */}
      <div className="rounded-3xl bg-slate-950/60 border border-slate-800/80 p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Monad Testnet Transaction History</span>
        </h3>

        <div className="space-y-2 text-xs">
          {task.createTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Escrow Created (createTask):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.createTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>{task.createTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {task.acceptTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Provider Assigned (acceptTask):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.acceptTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>{task.acceptTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {task.submitTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Result Checkpoint (submitResult):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.submitTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>{task.submitTxHash.slice(0, 16)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {task.approveTxHash && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-teal-400 font-semibold">Payout Released (approveTask):</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${task.approveTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-teal-300 hover:underline flex items-center gap-1"
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
