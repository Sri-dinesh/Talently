"use client";
/**
 * Swarm Task Detail Page — /swarm/[swarmId]
 * Shows swarm state, worker slots, join/submit form, escrow payouts, escrow refunds, and Swarm Intelligence Report
 */

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Zap,
  BarChart3,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  StopCircle,
  AlertTriangle,
  Coins,
  ShieldCheck,
  ExternalLink,
  RotateCcw,
  Sparkles,
  X
} from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { SwarmReport } from "@/components/SwarmReport";
import { VerificationScorecard } from "@/components/VerificationScorecard";
import { useJoinSwarm } from "@/hooks/useJoinSwarm";
import { useSubmitSwarmResult } from "@/hooks/useSubmitSwarmResult";
import { formatAddress } from "@/lib/utils";
import type { SwarmTask, SwarmSubmission } from "@/types/swarm";

function formatMon(wei: string): string {
  try {
    return (Number(BigInt(wei)) / 1e18).toFixed(4);
  } catch {
    return "0";
  }
}

const SUB_STATUS_STYLES: Record<string, string> = {
  EXECUTING: "bg-[#C26C00]/10 text-[#C26C00] dark:text-[#F59E0B] border border-[#C26C00]/20",
  SUBMITTED: "bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/20",
  VERIFIED: "bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/20",
  PAID_OUT: "bg-[#2E7D32]/15 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/30 font-semibold",
  REJECTED: "bg-[#C15F3C]/15 text-[#C15F3C] dark:text-[#D97757] border border-[#C15F3C]/30 font-medium",
  REFUNDED: "bg-[#8A857B]/15 text-[#6B665E] dark:text-[#B1ADA1] border border-[#8A857B]/30 font-medium",
  FLAGGED: "bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/20",
};

export default function SwarmDetailPage({ params }: { params: Promise<{ swarmId: string }> }) {
  const { swarmId } = use(params);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [task, setTask] = useState<SwarmTask | null>(null);
  const [submissions, setSubmissions] = useState<SwarmSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultText, setResultText] = useState("");
  const [resultSeverity, setResultSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [resultAttachmentUrl, setResultAttachmentUrl] = useState("");
  const [triggeringReport, setTriggeringReport] = useState(false);
  const [overridingId, setOverridingId] = useState<string | null>(null);
  const [payingOutId, setPayingOutId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [payoutStatusText, setPayoutStatusText] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { joinSwarm, state: joinState, error: joinError } = useJoinSwarm();
  const { submitSwarmResult, state: submitState, error: submitError } = useSubmitSwarmResult();
  const router = useRouter();

  async function fetchTask() {
    try {
      const res = await fetch("/api/swarm/" + swarmId);
      if (!res.ok) {
        setTask(null);
        return;
      }
      const json = await res.json();
      setTask(json.data);
      setSubmissions(json.data?.submissions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTask();
    const interval = setInterval(fetchTask, 5000);
    return () => clearInterval(interval);
  }, [swarmId]);

  const userAddress = address?.toLowerCase();
  const isRequester = Boolean(userAddress && task && task.requesterAddress === userAddress);
  const mySubmission = userAddress ? submissions.find((s) => s.workerAddress === userAddress) : null;
  const hasJoined = Boolean(mySubmission);
  const hasSubmitted = Boolean(mySubmission?.submittedAt);
  const isPaidOut = mySubmission?.status === "PAID_OUT";
  const isRejectedOrRefunded = mySubmission?.status === "REJECTED" || mySubmission?.status === "REFUNDED";
  const slotsUsed = submissions.length;
  const slotsAvailable = (task?.maxWorkers || 0) - slotsUsed;
  const canJoin = !hasJoined && slotsAvailable > 0 && (task?.status === "OPEN" || task?.status === "IN_PROGRESS") && !isRequester;

  const eligibleForPayout = submissions.filter(
    (s) => s.status === "VERIFIED" || (s.status === "SUBMITTED" && s.submittedAt)
  );
  const eligibleForRefund = submissions.filter(
    (s) => s.status === "REJECTED" || s.status === "FLAGGED"
  );
  const paidOutCount = submissions.filter((s) => s.status === "PAID_OUT").length;
  const refundedCount = submissions.filter((s) => s.status === "REFUNDED").length;

  async function handleJoin() {
    if (!task || !userAddress) return;
    await joinSwarm({ swarmId: task.id, workerAddress: userAddress });
    await fetchTask();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !userAddress) return;
    await submitSwarmResult({
      swarmId: task.id,
      workerAddress: userAddress,
      resultText,
      resultSeverity,
      resultAttachmentUrl: resultAttachmentUrl || null,
    });
    await fetchTask();
  }

  async function handleGenerateReport() {
    if (!task) return;
    setTriggeringReport(true);
    try {
      await fetch("/api/swarm/" + task.id + "/report", { method: "POST" });
      await fetchTask();
    } catch {
      // ignore
    } finally {
      setTriggeringReport(false);
    }
  }

  // Requester manual override — approve or reject any submitted slot
  async function handleOverride(submissionId: string, action: "APPROVE" | "REJECT") {
    if (!task || !userAddress) return;
    setOverridingId(submissionId + action);
    try {
      await fetch("/api/swarm/" + task.id + "/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action, requesterAddress: userAddress }),
      });
      await fetchTask();
    } catch {
      // ignore
    } finally {
      setOverridingId(null);
    }
  }

  // Requester release payout to worker(s)
  async function handleReleasePayout(
    targetSubmission?: SwarmSubmission,
    payoutAll?: boolean,
    useOnChainWallet: boolean = false
  ) {
    if (!task || !userAddress) return;
    setPayingOutId(payoutAll ? "all" : (targetSubmission?.id || "unknown"));
    setPayoutSuccessMsg(null);
    setPayoutError(null);

    const targets = payoutAll ? eligibleForPayout : (targetSubmission ? [targetSubmission] : []);
    if (targets.length === 0) {
      setPayingOutId(null);
      return;
    }

    try {
      const txHashes: Record<string, string> = {};

      if (useOnChainWallet && walletClient && publicClient) {
        for (const target of targets) {
          setPayoutStatusText(`Sign payout for ${formatAddress(target.workerAddress)} in wallet...`);
          try {
            const hash = await walletClient.sendTransaction({
              to: target.workerAddress as `0x${string}`,
              value: BigInt(task.rewardWeiPerWorker),
            });
            setPayoutStatusText(`Confirming tx ${hash.slice(0, 10)}... on Monad Testnet`);
            await publicClient.waitForTransactionReceipt({ hash });
            txHashes[target.id] = hash;
          } catch (chainErr) {
            console.warn("Wallet signing skipped:", chainErr);
          }
        }
      }

      setPayoutStatusText("Finalizing payout settlement...");
      const res = await fetch("/api/swarm/" + task.id + "/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: targetSubmission?.id,
          payoutAll: Boolean(payoutAll),
          requesterAddress: userAddress,
          txHash: targetSubmission ? txHashes[targetSubmission.id] : undefined,
          txHashes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to finalize payout");
      }

      setPayoutSuccessMsg(
        payoutAll
          ? `Successfully released payouts to all ${targets.length} workers on Monad!`
          : `Successfully released ${formatMon(task.rewardWeiPerWorker)} MON payout to ${formatAddress(targets[0]?.workerAddress || "")}!`
      );
      await fetchTask();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to release payout";
      setPayoutError(msg);
    } finally {
      setPayingOutId(null);
      setPayoutStatusText(null);
    }
  }

  // Requester claim refund for rejected / failed worker submissions back to creator
  async function handleRefund(targetSubmission?: SwarmSubmission, refundAll?: boolean) {
    if (!task || !userAddress) return;
    setRefundingId(refundAll ? "all" : (targetSubmission?.id || "unknown"));
    setPayoutSuccessMsg(null);
    setPayoutError(null);

    try {
      const res = await fetch("/api/swarm/" + task.id + "/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterAddress: userAddress,
          submissionId: targetSubmission?.id,
          refundAll: Boolean(refundAll),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to process escrow refund");
      }

      const count = json.data?.refundedCount || (targetSubmission ? 1 : 0);
      setPayoutSuccessMsg(
        `Successfully refunded escrow (${count} rejected slot${count > 1 ? "s" : ""}) back to your creator wallet on Monad!`
      );
      await fetchTask();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process refund";
      setPayoutError(msg);
    } finally {
      setRefundingId(null);
    }
  }

  // Cancel / stop the swarm entirely
  async function handleCancelSwarm() {
    if (!task || !userAddress) return;
    setCancelling(true);
    try {
      await fetch("/api/swarm/" + task.id + "/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterAddress: userAddress }),
      });
      router.push("/swarm");
    } catch {
      // ignore
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  }

  if (loading && !task) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C15F3C]" />
        <p className="text-sm text-[#8A857B] mt-3">Loading swarm task from Monad...</p>
      </div>
    );
  }
  if (!task) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#C15F3C] mx-auto" />
        <h2 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Swarm Task Not Found</h2>
        <Link
          href="/swarm"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] text-xs font-medium text-[#1A1A18] dark:text-[#F4F3EE]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Swarm
        </Link>
      </div>
    );
  }

  const totalRewardWei = (BigInt(task.rewardWeiPerWorker) * BigInt(task.maxWorkers)).toString();
  const totalPaidWei = (BigInt(task.rewardWeiPerWorker) * BigInt(paidOutCount)).toString();
  const totalRefundedWei = task.refundedWei || (BigInt(task.rewardWeiPerWorker) * BigInt(refundedCount)).toString();

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/swarm"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A857B] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Swarm
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTask}
            className="p-2 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] text-[#8A857B] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] border border-[#C15F3C]/20 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" />Swarm
          </span>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {task.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                  {task.category}
                </span>
              )}
              {paidOutCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/20">
                  <Coins className="w-3 h-3" />
                  {paidOutCount}/{task.maxWorkers} Paid Out
                </span>
              )}
              {refundedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] border border-[#C15F3C]/20">
                  <RotateCcw className="w-3 h-3" />
                  {refundedCount} Refunded
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE] tracking-tight">
              {task.title}
            </h1>
          </div>
          <div className="shrink-0 p-4 rounded-2xl bg-[#C15F3C]/5 border border-[#C15F3C]/20 text-right">
            <div className="text-[10px] text-[#C15F3C] dark:text-[#D97757] font-semibold uppercase tracking-wider">
              Per Worker Reward
            </div>
            <div className="text-2xl font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">
              {formatMon(task.rewardWeiPerWorker)} MON
            </div>
            <div className="text-[10px] text-[#8A857B] dark:text-[#7D7970] mt-0.5">
              Escrow Pool: {formatMon(totalRewardWei)} MON total
            </div>
          </div>
        </div>

        {/* Escrow Status & Accounting Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] text-center text-xs">
          <div>
            <span className="text-[10px] text-[#8A857B] uppercase block">Total Escrow Locked</span>
            <span className="font-semibold text-[#1A1A18] dark:text-[#F4F3EE] font-mono">{formatMon(totalRewardWei)} MON</span>
          </div>
          <div className="border-x border-[#E8E6DF] dark:border-[#2C2C29]">
            <span className="text-[10px] text-[#2E7D32] dark:text-[#4CAF50] uppercase block">Paid to Workers</span>
            <span className="font-semibold text-[#2E7D32] dark:text-[#4CAF50] font-mono">{formatMon(totalPaidWei)} MON ({paidOutCount})</span>
          </div>
          <div>
            <span className="text-[10px] text-[#C15F3C] dark:text-[#D97757] uppercase block">Refunded to Creator</span>
            <span className="font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">{formatMon(totalRefundedWei)} MON ({refundedCount})</span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] text-xs text-[#1A1A18] dark:text-[#F4F3EE] leading-relaxed whitespace-pre-wrap">
          {task.description}
        </div>

        {/* Acceptance Criteria */}
        {task.requirements.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-2">
            <span className="text-[10px] font-semibold text-[#8A857B] uppercase tracking-wider block">
              Acceptance Criteria
            </span>
            {task.requirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#1A1A18] dark:text-[#F4F3EE]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#4CAF50] shrink-0" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        )}

        {/* Worker slots panel */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider mb-3">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C15F3C]" />
              Worker Slots ({slotsUsed}/{task.maxWorkers})
            </span>
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 normal-case">
                <Clock className="w-3 h-3" />
                ~{task.estimatedMinutes}m each
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-[#F4F3EE] dark:bg-[#242422] mb-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C15F3C] transition-all duration-500"
              style={{ width: `${Math.min((slotsUsed / task.maxWorkers) * 100, 100)}%` }}
            />
          </div>
          <div className="space-y-2">
            {submissions.map((sub, idx) => {
              const isSubPaidOut = sub.status === "PAID_OUT";
              const isSubVerified = sub.status === "VERIFIED";
              const isSubRejected = sub.status === "REJECTED" || sub.status === "FLAGGED";
              const isSubRefunded = sub.status === "REFUNDED";

              return (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] gap-2.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-[#1A1A18] dark:text-[#F4F3EE]">
                          {formatAddress(sub.workerAddress)}
                        </span>
                        {sub.workerAddress === userAddress && (
                          <span className="text-[9px] font-semibold text-[#C15F3C] dark:text-[#D97757] px-1.5 py-0.2 rounded bg-[#C15F3C]/10">
                            You
                          </span>
                        )}
                        {isSubPaidOut && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#2E7D32] dark:text-[#4CAF50] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        )}
                        {isSubRefunded && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8A857B] font-semibold">
                            <RotateCcw className="w-3 h-3" />
                            Refunded
                          </span>
                        )}
                      </div>
                      {/* Show submission preview */}
                      {sub.resultText && (
                        <p className="text-[11px] text-[#8A857B] dark:text-[#7D7970] mt-0.5 line-clamp-1">
                          {sub.resultText.slice(0, 80)}
                          {sub.resultText.length > 80 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Status Badge */}
                    {isSubPaidOut ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2E7D32]/15 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/30">
                          <Coins className="w-3 h-3" />
                          Paid Out ({formatMon(task.rewardWeiPerWorker)} MON)
                        </span>
                        {sub.payoutTxHash && (
                          <a
                            href={`https://testnet.monadexplorer.com/tx/${sub.payoutTxHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#C15F3C] dark:text-[#D97757] hover:underline flex items-center gap-0.5"
                            title="View on Monad Explorer"
                          >
                            <span>Tx</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ) : isSubRefunded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#8A857B]/15 text-[#6B665E] dark:text-[#B1ADA1] border border-[#8A857B]/30">
                        <RotateCcw className="w-3 h-3" />
                        Refunded to Creator
                      </span>
                    ) : (
                      <span className={"px-2.5 py-0.5 rounded-full text-[9px] font-semibold " + (SUB_STATUS_STYLES[sub.status] || "")}>
                        {sub.status}
                      </span>
                    )}

                    {/* Requester Actions: Pay or Refund or Override */}
                    {isRequester && sub.submittedAt && !isSubPaidOut && !isSubRefunded && (
                      <div className="flex items-center gap-1.5">
                        {/* Payout button if verified/submitted */}
                        {(isSubVerified || sub.status === "SUBMITTED") && (
                          <button
                            onClick={() => handleReleasePayout(sub, false, false)}
                            disabled={payingOutId !== null}
                            title="Release escrow payout to this worker"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2E7D32] hover:bg-[#256327] text-white text-[10px] font-semibold shadow-2xs transition-colors disabled:opacity-50"
                          >
                            {payingOutId === sub.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Coins className="w-3 h-3" />
                            )}
                            <span>Pay {formatMon(task.rewardWeiPerWorker)} MON</span>
                          </button>
                        )}

                        {/* Refund button if rejected */}
                        {isSubRejected && (
                          <button
                            onClick={() => handleRefund(sub, false)}
                            disabled={refundingId !== null}
                            title="Claim escrow refund for rejected submission"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C15F3C] hover:bg-[#A84F30] text-white text-[10px] font-semibold shadow-2xs transition-colors disabled:opacity-50"
                          >
                            {refundingId === sub.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span>Refund {formatMon(task.rewardWeiPerWorker)} MON</span>
                          </button>
                        )}

                        {/* Quick Override Buttons */}
                        <button
                          onClick={() => handleOverride(sub.id, "APPROVE")}
                          disabled={overridingId !== null || isSubVerified}
                          title="Approve this submission"
                          className="p-1.5 rounded-lg bg-[#2E7D32]/10 text-[#2E7D32] hover:bg-[#2E7D32]/20 disabled:opacity-40 transition-colors"
                        >
                          {overridingId === sub.id + "APPROVE" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOverride(sub.id, "REJECT")}
                          disabled={overridingId !== null || isSubRejected}
                          title="Reject this submission (enables refund)"
                          className="p-1.5 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] hover:bg-[#C15F3C]/20 disabled:opacity-40 transition-colors"
                        >
                          {overridingId === sub.id + "REJECT" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ThumbsDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {Array.from({ length: slotsAvailable }).map((_, i) => (
              <div key={"empty-" + i} className="flex items-center p-3 rounded-xl border border-dashed border-[#E8E6DF] dark:border-[#2C2C29]">
                <span className="text-xs text-[#B1ADA1] dark:text-[#7D7970]">Open slot</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="space-y-4">
        {/* Payout status banner with instant-skip and cancel controls */}
        {payoutStatusText && (
          <div className="p-4 rounded-2xl bg-[#C15F3C]/10 border border-[#C15F3C]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#C15F3C] shrink-0" />
              <span className="text-xs font-semibold text-[#C15F3C]">{payoutStatusText}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReleasePayout(undefined, true, false)}
                className="px-3 py-1 rounded-lg bg-[#2E7D32] text-white text-[11px] font-semibold hover:bg-[#256327] transition-colors"
              >
                Release Instantly ⚡
              </button>
              <button
                onClick={() => { setPayingOutId(null); setPayoutStatusText(null); }}
                className="p-1 rounded-lg text-[#8A857B] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE]"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Notification banner */}
        {payoutSuccessMsg && (
          <div className="p-4 rounded-2xl bg-[#2E7D32]/15 border border-[#2E7D32]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2E7D32] dark:text-[#4CAF50]">
              <Coins className="w-4 h-4" />
              <span>{payoutSuccessMsg}</span>
            </div>
            <button
              onClick={() => setPayoutSuccessMsg(null)}
              className="text-[#2E7D32] dark:text-[#4CAF50] text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error banner */}
        {payoutError && (
          <div className="p-4 rounded-2xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#C15F3C]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{payoutError}</span>
            </div>
            <button
              onClick={() => setPayoutError(null)}
              className="text-[#C15F3C] text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Not connected */}
        {!isConnected && (
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29]">
            <WalletConnectButton />
          </div>
        )}

        {/* Can join */}
        {isConnected && canJoin && (
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Join This Swarm</h3>
                <p className="text-xs text-[#8A857B]">
                  Earn {formatMon(task.rewardWeiPerWorker)} MON on Monad for verified execution. {slotsAvailable} slot{slotsAvailable !== 1 ? "s" : ""} remaining.
                </p>
              </div>
            </div>
            {joinError && (
              <div className="p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs">
                {joinError}
              </div>
            )}
            <button
              onClick={handleJoin}
              disabled={joinState === "joining"}
              className="w-full py-3.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {joinState === "joining" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Swarm...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Join Swarm — {formatMon(task.rewardWeiPerWorker)} MON reward</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Worker executing */}
        {isConnected && hasJoined && !hasSubmitted && (
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C26C00]/10 text-[#C26C00] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Submit Your Findings</h3>
                <p className="text-xs text-[#8A857B]">
                  You have joined this swarm. Submit your detailed findings to earn {formatMon(task.rewardWeiPerWorker)} MON.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">
                  Severity
                </label>
                <select
                  value={resultSeverity}
                  onChange={(e) => setResultSeverity(e.target.value as "Low" | "Medium" | "High")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs focus:outline-none focus:border-[#C15F3C]"
                >
                  <option value="Low">Low — Minor issue</option>
                  <option value="Medium">Medium — Notable friction</option>
                  <option value="High">High — Blocker or crash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">
                  Findings & Reproduction Steps <span className="text-[#C15F3C]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Describe what you found, steps to reproduce, and your overall assessment..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] text-xs focus:outline-none focus:border-[#C15F3C] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">
                  Proof / Screenshot URL (Optional)
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
                disabled={submitState === "submitting" || !resultText.trim()}
                className="w-full py-3.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitState === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting & Verifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Findings — Run 4-Layer Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Worker: Submission already paid out! */}
        {isConnected && isPaidOut && (
          <div className="p-6 rounded-3xl bg-[#2E7D32]/10 border border-[#2E7D32]/25 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/20 text-[#2E7D32] dark:text-[#4CAF50] flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#2E7D32] dark:text-[#4CAF50]">
                    🎉 Escrow Payout Released on Monad!
                  </h3>
                  <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1]">
                    Reward of <strong className="text-[#2E7D32] dark:text-[#4CAF50] font-mono">{formatMon(task.rewardWeiPerWorker)} MON</strong> has been transferred directly to your wallet.
                  </p>
                </div>
              </div>
              {mySubmission?.payoutTxHash && (
                <a
                  href={`https://testnet.monadexplorer.com/tx/${mySubmission.payoutTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2E7D32]/15 text-[#2E7D32] dark:text-[#4CAF50] text-xs font-semibold hover:bg-[#2E7D32]/25 transition-colors shrink-0"
                >
                  <span>Monad Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {mySubmission?.verificationScorecard && (
              <VerificationScorecard scorecard={mySubmission.verificationScorecard} />
            )}
          </div>
        )}

        {/* Worker: Rejected or refunded */}
        {isConnected && isRejectedOrRefunded && (
          <div className="p-5 rounded-2xl bg-[#C15F3C]/10 border border-[#C15F3C]/25 space-y-2">
            <div className="flex items-center gap-2 text-[#C15F3C] font-semibold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Submission Rejected — Escrow Refunded to Creator</span>
            </div>
            <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
              This submission was flagged by the verification engine or rejected by the creator. Escrow funds ({formatMon(task.rewardWeiPerWorker)} MON) have been returned to the task creator.
            </p>
          </div>
        )}

        {/* Worker: Submitted & verified but awaiting payout */}
        {isConnected && hasSubmitted && !isPaidOut && !isRejectedOrRefunded && mySubmission?.verificationScorecard && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#2E7D32]/5 border border-[#2E7D32]/15 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-[#4CAF50]" />
              <p className="text-xs text-[#2E7D32] dark:text-[#4CAF50] font-medium">
                Your submission is verified! Payout of {formatMon(task.rewardWeiPerWorker)} MON will be released by the requester upon escrow payout confirmation.
              </p>
            </div>
            <VerificationScorecard scorecard={mySubmission.verificationScorecard} />
          </div>
        )}

        {/* Requester: Batch Escrow Release Panel */}
        {isConnected && isRequester && eligibleForPayout.length > 0 && task.status !== "CANCELLED" && (
          <div className="p-6 rounded-3xl bg-[#2E7D32]/5 border border-[#2E7D32]/25 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/15 text-[#2E7D32] dark:text-[#4CAF50] flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                    Release Swarm Escrow Payouts
                  </h3>
                  <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                    {eligibleForPayout.length} worker{eligibleForPayout.length > 1 ? "s have" : " has"} submitted verified findings.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-[#2E7D32] dark:text-[#4CAF50] font-mono block">
                  {(parseFloat(formatMon(task.rewardWeiPerWorker)) * eligibleForPayout.length).toFixed(4)} MON
                </span>
                <span className="text-[10px] text-[#8A857B]">Total to release</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Primary 1-Click Fast Settlement */}
              <button
                onClick={() => handleReleasePayout(undefined, true, false)}
                disabled={payingOutId !== null}
                className="py-3.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#256327] active:scale-[0.985] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
              >
                {payingOutId === "all" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Releasing Payouts...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Instant Release ({eligibleForPayout.length} Workers · {(parseFloat(formatMon(task.rewardWeiPerWorker)) * eligibleForPayout.length).toFixed(4)} MON)</span>
                  </>
                )}
              </button>

              {/* Optional On-Chain Wallet Sign */}
              <button
                onClick={() => handleReleasePayout(undefined, true, true)}
                disabled={payingOutId !== null}
                className="py-3.5 px-4 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#2E7D32]/30 text-[#2E7D32] dark:text-[#4CAF50] hover:bg-[#2E7D32]/10 active:scale-[0.985] font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>Sign in MetaMask & Transfer MON</span>
              </button>
            </div>
          </div>
        )}

        {/* Requester: Escrow Refund Panel for Rejected Slots */}
        {isConnected && isRequester && eligibleForRefund.length > 0 && task.status !== "CANCELLED" && (
          <div className="p-6 rounded-3xl bg-[#C15F3C]/5 border border-[#C15F3C]/25 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/15 text-[#C15F3C] flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                    Claim Escrow Refund for Rejected Slots
                  </h3>
                  <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                    {eligibleForRefund.length} submission{eligibleForRefund.length > 1 ? "s were" : " was"} rejected. Reclaim unspent escrow reward back to your creator wallet.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-[#C15F3C] dark:text-[#D97757] font-mono block">
                  {(parseFloat(formatMon(task.rewardWeiPerWorker)) * eligibleForRefund.length).toFixed(4)} MON
                </span>
                <span className="text-[10px] text-[#8A857B]">Refund available</span>
              </div>
            </div>

            <button
              onClick={() => handleRefund(undefined, true)}
              disabled={refundingId !== null}
              className="w-full py-3.5 px-4 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              {refundingId === "all" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Escrow Refund...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Claim Escrow Refund ({eligibleForRefund.length} Slots · {(parseFloat(formatMon(task.rewardWeiPerWorker)) * eligibleForRefund.length).toFixed(4)} MON)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Requester: Generate report manually */}
        {isConnected && isRequester && submissions.filter((s) => s.submittedAt).length > 0 && task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C15F3C]" />
              Generate Swarm Intelligence Report
            </h3>
            <p className="text-xs text-[#8A857B]">
              {submissions.filter((s) => s.submittedAt).length} submission{submissions.filter((s) => s.submittedAt).length !== 1 ? "s" : ""} ready to process. You can generate the report before all slots fill.
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={triggeringReport}
              className="w-full py-3 rounded-xl bg-[#1A1A18] dark:bg-[#F4F3EE] hover:bg-[#2C2C29] dark:hover:bg-[#ECEAE4] text-white dark:text-[#1A1A18] font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {triggeringReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Swarm Engine...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>Generate Swarm Intelligence Report</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Requester: Stop / Cancel Swarm */}
        {isConnected && isRequester && task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
          <div className="p-5 rounded-2xl border border-[#C15F3C]/20 bg-[#C15F3C]/3 dark:bg-[#C15F3C]/5 space-y-3">
            <div className="flex items-center gap-2">
              <StopCircle className="w-4 h-4 text-[#C15F3C]" />
              <h3 className="text-sm font-semibold text-[#C15F3C]">Stop Swarm</h3>
            </div>
            {!cancelConfirm ? (
              <>
                <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                  Stop and remove this swarm. Workers already executing will no longer be able to submit. Unspent escrow pool will be refunded.
                </p>
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="w-full py-2.5 rounded-xl border border-[#C15F3C]/40 text-[#C15F3C] text-sm font-medium hover:bg-[#C15F3C]/10 transition-colors flex items-center justify-center gap-2"
                >
                  <StopCircle className="w-4 h-4" /> Stop This Swarm & Reclaim Escrow
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/20">
                  <AlertTriangle className="w-4 h-4 text-[#C15F3C] shrink-0" />
                  <p className="text-xs text-[#C15F3C] font-medium">This will permanently stop the swarm and refund unspent escrow. Are you sure?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E8E6DF] dark:border-[#2C2C29] text-xs font-medium text-[#8A857B] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
                  >
                    Keep Running
                  </button>
                  <button
                    onClick={handleCancelSwarm}
                    disabled={cancelling}
                    className="flex-1 py-2.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      <>
                        <StopCircle className="w-3.5 h-3.5" />
                        Yes, Stop & Refund
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Already cancelled banner */}
        {task.status === "CANCELLED" && (
          <div className="p-4 rounded-2xl bg-[#B1ADA1]/10 border border-[#B1ADA1]/30 flex items-center gap-3">
            <StopCircle className="w-5 h-5 text-[#6B665E] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#6B665E]">Swarm Cancelled & Escrow Refunded</p>
              <p className="text-xs text-[#8A857B]">This swarm has been stopped by the requester and unspent escrow has been returned.</p>
            </div>
          </div>
        )}
      </div>

      {/* Swarm Intelligence Report */}
      {task.status === "PROCESSING" && (
        <SwarmReport
          report={{
            participantCount: 0,
            validCount: 0,
            flaggedCount: 0,
            uniqueFindings: [],
            topIssue: null,
            topIssueConfirmedBy: 0,
            consensusScore: 0,
            confidence: 0,
            aiSummary: null,
            generatedAt: new Date().toISOString(),
          }}
          isProcessing
        />
      )}
      {task.status === "COMPLETED" && task.clusterReport && (
        <SwarmReport report={task.clusterReport} />
      )}
    </div>
  );
}