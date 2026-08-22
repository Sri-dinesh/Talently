"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { 
  ArrowLeft, Users, Clock, Loader2, Send, ShieldCheck, 
  Coins, Sparkles, CheckCircle2, AlertTriangle, X, Zap
} from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useJoinSwarm } from "@/hooks/useJoinSwarm";
import { useSubmitSwarmResult } from "@/hooks/useSubmitSwarmResult";
import { formatAddress } from "@/lib/utils";
import type { SwarmTask, SwarmSubmission } from "@/types/swarm";
import { SwarmGraph } from "@/components/swarm-graph/SwarmGraph";
import { Node } from "@xyflow/react";

function formatMon(wei: string): string {
  try {
    return (Number(BigInt(wei)) / 1e18).toFixed(4);
  } catch {
    return "0";
  }
}

export default function SwarmGraphPage({ params }: { params: Promise<{ swarmId: string }> }) {
  const { swarmId } = use(params);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const router = useRouter();

  const [task, setTask] = useState<SwarmTask | null>(null);
  const [submissions, setSubmissions] = useState<SwarmSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [resultText, setResultText] = useState("");
  const [resultSeverity, setResultSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [resultAttachmentUrl, setResultAttachmentUrl] = useState("");
  
  // UI State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPayoutOverlay, setShowPayoutOverlay] = useState(false);
  const [showActionCenter, setShowActionCenter] = useState(false);

  // Operation State
  const [payingOutId, setPayingOutId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [overridingId, setOverridingId] = useState<string | null>(null);
  const [triggeringReport, setTriggeringReport] = useState(false);
  const [payoutStatusText, setPayoutStatusText] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  
  const { joinSwarm, state: joinState } = useJoinSwarm();
  const { submitSwarmResult, state: submitState } = useSubmitSwarmResult();

  async function fetchTask() {
    try {
      const res = await fetch("/api/swarm/" + swarmId);
      if (!res.ok) return setTask(null);
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
    const interval = setInterval(fetchTask, 3000);
    return () => clearInterval(interval);
  }, [swarmId]);

  const userAddress = address?.toLowerCase();
  const isRequester = Boolean(userAddress && task && task.requesterAddress.toLowerCase() === userAddress);
  const mySubmission = userAddress ? submissions.find((s) => s.workerAddress.toLowerCase() === userAddress) : null;
  const hasJoined = Boolean(mySubmission);
  
  const slotsUsed = submissions.length;
  const slotsAvailable = (task?.maxWorkers || 0) - slotsUsed;
  const canJoin = !hasJoined && slotsAvailable > 0 && (task?.status === "OPEN" || task?.status === "IN_PROGRESS") && !isRequester;

  // Anything awaiting a decision from the requester:
  //  - SUBMITTED: AI gave REVIEW/manual verdict, requester must approve or reject
  //  - VERIFIED:   AI gave PASS, requester must now trigger the on-chain payout
  const reviewQueue = submissions.filter(s => {
    const st = s.status?.toUpperCase();
    return st === "SUBMITTED" || st === "VERIFIED";
  });
  const eligibleForPayout = submissions.filter(s => s.status === "VERIFIED" || (s.status === "SUBMITTED" && s.submittedAt));
  const eligibleForRefund = submissions.filter(s => s.status === "REJECTED" || s.status === "FLAGGED");
  const paidOutCount = submissions.filter(s => s.status === "PAID_OUT").length;
  const refundedCount = submissions.filter(s => s.status === "REFUNDED").length;
  const verifiedCount = submissions.filter(s => s.status === "VERIFIED" || s.status === "PAID_OUT").length;
  // Backwards-compat alias used by the floating action center below.
  const pendingSubmissions = reviewQueue;

  const showSwarmComplete = task?.status === "COMPLETED" && paidOutCount > 0 && paidOutCount === verifiedCount;

  // Auto-open the action center the first time the requester sees items
  // needing review, so they never miss a pending payout / override.
  useEffect(() => {
    if (isRequester && reviewQueue.length > 0) {
      setShowActionCenter(true);
    } else {
      setShowActionCenter(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequester, reviewQueue.length]);

  // Actions
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
    setSelectedNode(null); // Close sidebar after submit
  }

  async function handleGenerateReport() {
    if (!task) return;
    setTriggeringReport(true);
    try {
      await fetch("/api/swarm/" + task.id + "/report", { method: "POST" });
      await fetchTask();
    } finally {
      setTriggeringReport(false);
    }
  }

  async function handleOverride(submissionId: string, action: "APPROVE" | "REJECT") {
    if (!task || !userAddress) return;
    setOverridingId(submissionId + action);
    try {
      const target = submissions.find((s) => s.id === submissionId);

      if (action === "APPROVE") {
        // Path 1: AI already auto-verified → just execute the on-chain payout.
        // Path 2: Submission is still SUBMITTED → override to VERIFIED first,
        //         then send the funds in the same requester action.
        const alreadyVerified = target?.status?.toUpperCase() === "VERIFIED";

        let hash: `0x${string}` | "" = "";
        if (walletClient && publicClient && target) {
          hash = await walletClient.sendTransaction({
            to: target.workerAddress as `0x${string}`,
            value: BigInt(task.rewardWeiPerWorker),
          });
          await publicClient.waitForTransactionReceipt({ hash });
        }

        if (!alreadyVerified) {
          // Flip SUBMITTED → VERIFIED so the payout endpoint will accept it.
          await fetch("/api/swarm/" + task.id + "/override", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId, action: "APPROVE", requesterAddress: userAddress }),
          });
        }

        await fetch("/api/swarm/" + task.id + "/payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, requesterAddress: userAddress, txHash: hash }),
        });
      } else {
        // REJECT: never touch the chain — just record the override.
        await fetch("/api/swarm/" + task.id + "/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, action, requesterAddress: userAddress }),
        });
      }
      await fetchTask();
    } catch (err) {
      console.error(err);
      alert("Transaction failed or rejected.");
    } finally {
      setOverridingId(null);
    }
  }

  async function handleReleasePayout(payoutAll = true) {
    if (!task || !userAddress) return;
    setPayingOutId(payoutAll ? "all" : "single");
    setPayoutStatusText("Signing...");
    
    try {
      const targets = eligibleForPayout;
      const txHashes: Record<string, string> = {};

      if (walletClient && publicClient) {
        for (const target of targets) {
          try {
            const hash = await walletClient.sendTransaction({
              to: target.workerAddress as `0x${string}`,
              value: BigInt(task.rewardWeiPerWorker),
            });
            setPayoutStatusText(`Confirming tx ${hash.slice(0, 10)}...`);
            await publicClient.waitForTransactionReceipt({ hash });
            txHashes[target.id] = hash;
          } catch (err) {
            console.error(err);
          }
        }
      }

      await fetch("/api/swarm/" + task.id + "/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutAll,
          requesterAddress: userAddress,
          txHashes,
        }),
      });

      setPayoutSuccessMsg("Payouts released successfully");
      await fetchTask();
      setTimeout(() => setPayoutSuccessMsg(null), 3000);
    } finally {
      setPayingOutId(null);
      setPayoutStatusText(null);
      setShowPayoutOverlay(false);
    }
  }

  async function handleRefund() {
    if (!task || !userAddress) return;
    setRefundingId("all");
    try {
      await fetch("/api/swarm/" + task.id + "/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterAddress: userAddress, refundAll: true }),
      });
      await fetchTask();
    } finally {
      setRefundingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-[#C15F3C] animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="text-[#B1ADA1]">Swarm task not found.</div>
      </div>
    );
  }

  // Find the selected submission if a human node is clicked
  const selectedSubmission = selectedNode?.type === "human" 
    ? submissions.find(s => s.id === selectedNode.data.submissionId)
    : null;

  return (
    <div className="w-full h-screen bg-[#0A0A0A] overflow-hidden relative font-sans">
      
      {/* 1. Main Graph Engine (Background) */}
      <div className="absolute inset-0 z-0">
        <SwarmGraph 
          task={task} 
          submissions={submissions} 
          onNodeClick={(node) => setSelectedNode(node)} 
        />
      </div>

      {/* 2. Top Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/swarm" className="inline-flex items-center gap-2 px-4 py-2 bg-[#121211]/80 backdrop-blur-md border border-[#2C2C29] rounded-xl text-sm font-medium text-[#B1ADA1] hover:text-[#F4F3EE] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
        </div>
        <div className="pointer-events-auto">
          <WalletConnectButton />
        </div>
      </div>

      {/* 3. Left Panel: Swarm Info */}
      <div className="absolute top-20 left-4 w-[320px] bg-[#121211]/80 backdrop-blur-md border border-[#2C2C29] rounded-2xl p-5 z-10 flex flex-col gap-4 pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C15F3C]" />
          <h1 className="text-[#F4F3EE] font-bold text-lg tracking-tight leading-tight">Swarm Engine</h1>
        </div>
        
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8A857B] tracking-wider">Task Target</span>
          <p className="text-sm text-[#F4F3EE] font-medium">{task.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="p-3 bg-[#1A1A18] rounded-xl border border-[#3A3A36]">
            <span className="text-[10px] uppercase font-bold text-[#8A857B]">Total Pool</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-sm font-mono font-bold text-[#F59E0B]">{formatMon((BigInt(task.rewardWeiPerWorker) * BigInt(task.maxWorkers)).toString())} MON</span>
            </div>
          </div>
          <div className="p-3 bg-[#1A1A18] rounded-xl border border-[#3A3A36]">
            <span className="text-[10px] uppercase font-bold text-[#8A857B]">Active Nodes</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-sm font-mono font-bold text-[#3B82F6]">{slotsUsed}/{task.maxWorkers}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons for Requester/Worker */}
        <div className="pt-2 flex flex-col gap-2">
          {canJoin && (
            <button 
              onClick={handleJoin}
              disabled={joinState === "joining" || !isConnected}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wide bg-[#C15F3C] text-white hover:bg-[#D97757] disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(193,95,60,0.3)]"
            >
              {joinState === "joining" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isConnected ? "INJECT NODE (JOIN SWARM)" : "CONNECT WALLET"}
            </button>
          )}

          {/* RELEASE PAYOUTS — visible whenever there are verified (or submitted)
              workers who haven't been paid out yet, regardless of task status. */}
          {isRequester && eligibleForPayout.length > 0 && paidOutCount < eligibleForPayout.length && (
            <button
              onClick={() => setShowPayoutOverlay(true)}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-[#10B981] text-white hover:bg-[#34D399] transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Coins className="w-4 h-4" />
              RELEASE PAYOUTS ({eligibleForPayout.length})
            </button>
          )}
          
          {isRequester && task.status === "OPEN" && (
            <button
              onClick={handleGenerateReport}
              disabled={triggeringReport || slotsUsed === 0}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-[#3B82F6] text-white hover:bg-[#60A5FA] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              {triggeringReport ? "GENERATING..." : "FORCE VERIFICATION"}
            </button>
          )}

          {isRequester && (task.status === "COMPLETED" || task.status === "CANCELLED") && eligibleForRefund.length > 0 && refundedCount < eligibleForRefund.length && (
            <button
              onClick={handleRefund}
              disabled={!!refundingId}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-[#8A857B] text-white hover:bg-[#B1ADA1] transition-all flex justify-center items-center gap-2"
            >
              {refundingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              REFUND ESCROW
            </button>
          )}

        </div>

      </div>

      {/* 4. Right Panel: Inspector / Submission */}
      {(hasJoined || selectedSubmission) && (
        <div className="absolute top-20 right-4 w-[360px] max-h-[calc(100vh-120px)] overflow-y-auto bg-[#121211]/90 backdrop-blur-xl border border-[#3A3A36] rounded-2xl shadow-2xl z-20 pointer-events-auto">
          <div className="sticky top-0 bg-[#121211]/95 px-5 py-4 border-b border-[#2C2C29] flex justify-between items-center">
            <h2 className="text-[#F4F3EE] font-bold text-sm tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C15F3C]" />
              NODE INSPECTOR
            </h2>
            <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-[#2C2C29] rounded-md transition-colors text-[#8A857B]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {/* If looking at own active submission */}
            {hasJoined && mySubmission?.status === "EXECUTING" && (!selectedSubmission || selectedSubmission.id === mySubmission.id) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl mb-4">
                  <span className="text-[#3B82F6] text-xs font-semibold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                    NODE ASSIGNED. AWAITING DATA.
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#8A857B] uppercase tracking-wider">Execution Payload</label>
                  <textarea
                    value={resultText}
                    onChange={e => setResultText(e.target.value)}
                    required
                    rows={4}
                    className="w-full p-3 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl text-sm text-[#F4F3EE] focus:border-[#C15F3C] outline-none font-mono"
                    placeholder="Enter evidence or proof of work..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitState === "submitting"}
                  className="w-full py-3 rounded-xl font-bold text-sm tracking-wide bg-[#F4F3EE] text-[#0A0A0A] hover:bg-white disabled:opacity-50 transition-all flex justify-center items-center gap-2 mt-4"
                >
                  {submitState === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  TRANSMIT PACKET
                </button>
              </form>
            )}

            {/* If inspecting a specific submission (Requester view or past submission) */}
            {selectedSubmission && selectedSubmission.status !== "EXECUTING" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#8A857B] uppercase tracking-wider">Worker Address</span>
                  <span className="text-sm font-mono text-[#F4F3EE] bg-[#1A1A18] px-2 py-1 rounded border border-[#2C2C29]">
                    {formatAddress(selectedSubmission.workerAddress)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#8A857B] uppercase tracking-wider">Payload</span>
                  <div className="text-sm text-[#B1ADA1] bg-[#0A0A0A] p-3 rounded-xl border border-[#2C2C29] font-mono break-words">
                    {selectedSubmission.resultText || "No text provided."}
                  </div>
                </div>

                {isRequester && (selectedSubmission.status === "SUBMITTED" || selectedSubmission.status === "VERIFIED") && (
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#2C2C29]">
                    <button
                      onClick={() => handleOverride(selectedSubmission.id, "REJECT")}
                      disabled={!!overridingId}
                      className="py-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] font-bold text-xs rounded-lg transition-colors border border-[#EF4444]/30 flex justify-center items-center gap-2"
                    >
                      {overridingId === selectedSubmission.id + "REJECT" && <Loader2 className="w-3 h-3 animate-spin" />}
                      REJECT
                    </button>
                    <button
                      onClick={() => handleOverride(selectedSubmission.id, "APPROVE")}
                      disabled={!!overridingId}
                      className="py-2 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-black text-xs rounded-lg transition-colors border border-[#10B981] flex justify-center items-center gap-2"
                    >
                      {overridingId === selectedSubmission.id + "APPROVE" && <Loader2 className="w-3 h-3 animate-spin" />}
                      {selectedSubmission.status === "VERIFIED" ? "PAY & APPROVE" : "APPROVE"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Bottom Footer (Monad Status) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex justify-between items-end pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-[#121211]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#2C2C29]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#836EF9] animate-pulse" />
            <span className="text-xs font-bold text-[#F4F3EE]">MONAD TESTNET</span>
          </div>
          <div className="w-px h-3 bg-[#3A3A36]" />
          <span className="text-xs font-mono text-[#8A857B]">Tps: 10k+</span>
        </div>
      </div>

      {/* 5b. Persistent Swarm Activity Bar — always visible at bottom-center so
          workers AND requesters can see live swarm state and quick actions. */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#121211]/90 backdrop-blur-xl border border-[#2C2C29] rounded-2xl px-3 py-2 shadow-2xl">
          {/* Live swarm counters */}
          <div className="flex items-center gap-1.5 px-2">
            <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="text-[11px] font-mono font-bold text-[#F4F3EE]">{slotsUsed}/{task.maxWorkers}</span>
            <span className="text-[9px] font-bold text-[#8A857B] tracking-widest">JOINED</span>
          </div>
          <div className="w-px h-5 bg-[#2C2C29]" />
          <div className="flex items-center gap-1.5 px-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[11px] font-mono font-bold text-[#10B981]">{verifiedCount}</span>
            <span className="text-[9px] font-bold text-[#8A857B] tracking-widest">VERIFIED</span>
          </div>
          <div className="w-px h-5 bg-[#2C2C29]" />
          <div className="flex items-center gap-1.5 px-2">
            <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[11px] font-mono font-bold text-[#F59E0B]">{paidOutCount}</span>
            <span className="text-[9px] font-bold text-[#8A857B] tracking-widest">PAID</span>
          </div>

          {/* Status pill for requester */}
          {isRequester && reviewQueue.length > 0 && (
            <>
              <div className="w-px h-5 bg-[#2C2C29]" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10B981]/15 border border-[#10B981]/40 rounded-lg animate-pulse">
                <Zap className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[10px] font-black text-[#10B981] tracking-widest">
                  {reviewQueue.length} TO REVIEW
                </span>
              </div>
            </>
          )}

          {/* Worker self-status */}
          {!isRequester && mySubmission && (
            <>
              <div className="w-px h-5 bg-[#2C2C29]" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A18] border border-[#2C2C29] rounded-lg">
                <div
                  className={
                    "w-1.5 h-1.5 rounded-full " +
                    (mySubmission.status === "EXECUTING"
                      ? "bg-[#3B82F6] animate-pulse"
                      : mySubmission.status === "SUBMITTED"
                        ? "bg-[#F59E0B] animate-pulse"
                        : mySubmission.status === "VERIFIED"
                          ? "bg-[#10B981]"
                          : mySubmission.status === "PAID_OUT"
                            ? "bg-[#10B981]"
                            : mySubmission.status === "REJECTED"
                              ? "bg-[#EF4444]"
                              : "bg-[#8A857B]")
                  }
                />
                <span className="text-[10px] font-black text-[#F4F3EE] tracking-widest">
                  YOU · {mySubmission.status}
                </span>
              </div>
            </>
          )}

          {/* Requester quick-CTAs */}
          {isRequester && reviewQueue.length > 0 && (
            <>
              <div className="w-px h-5 bg-[#2C2C29]" />
              {reviewQueue.some((s) => s.status === "VERIFIED") && (
                <button
                  onClick={() => setShowPayoutOverlay(true)}
                  className="px-3 py-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-black text-[10px] rounded-lg tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                >
                  <Coins className="w-3 h-3" />
                  PAY ALL
                </button>
              )}
              <button
                onClick={() => setShowActionCenter(true)}
                className="px-3 py-1.5 bg-[#F4F3EE] hover:bg-white text-[#0A0A0A] font-black text-[10px] rounded-lg tracking-widest flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3" />
                REVIEW QUEUE
              </button>
            </>
          )}

          {/* Refund CTA for requester with rejected slots */}
          {isRequester && eligibleForRefund.length > 0 && refundedCount < eligibleForRefund.length && (
            <>
              <div className="w-px h-5 bg-[#2C2C29]" />
              <button
                onClick={handleRefund}
                disabled={!!refundingId}
                className="px-3 py-1.5 bg-[#8A857B]/20 hover:bg-[#8A857B]/30 text-[#B1ADA1] border border-[#8A857B]/30 font-bold text-[10px] rounded-lg tracking-widest flex items-center gap-1.5"
              >
                {refundingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                REFUND
              </button>
            </>
          )}
        </div>
      </div>

      {/* 6. Action Center for Requester (Bottom Floating) */}
      {isRequester && reviewQueue.length > 0 && showActionCenter && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl pointer-events-auto">
          <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#10B981]/50 rounded-2xl p-5 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-[#10B981] tracking-widest flex items-center gap-2">
                <Zap className="w-5 h-5 animate-pulse" />
                ACTION REQUIRED: {reviewQueue.length} WORKER(S) AWAITING REVIEW
              </h3>
              <div className="flex items-center gap-2">
                {reviewQueue.some((s) => s.status === "VERIFIED") && (
                  <button
                    onClick={() => setShowPayoutOverlay(true)}
                    className="px-3 py-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-black text-[10px] rounded-lg tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  >
                    <Coins className="w-3 h-3" />
                    PAY ALL VERIFIED
                  </button>
                )}
                <button
                  onClick={() => setShowActionCenter(false)}
                  className="p-1.5 hover:bg-[#2C2C29] rounded-md transition-colors text-[#8A857B]"
                  aria-label="Close review queue"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 max-h-[35vh] overflow-y-auto custom-scrollbar pr-2">
              {reviewQueue.map(sub => {
                const isVerified = sub.status === "VERIFIED";
                return (
                  <div key={sub.id} className="flex items-center justify-between bg-[#121211] p-4 rounded-xl border border-[#2C2C29]">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-xs font-mono text-[#8A857B]">Worker: {formatAddress(sub.workerAddress)}</p>
                        <span
                          className={
                            "text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded " +
                            (isVerified
                              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                              : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30")
                          }
                        >
                          {isVerified ? "VERIFIED · PAY TO RELEASE" : "AWAITING DECISION"}
                        </span>
                      </div>
                      <p className="text-sm text-[#F4F3EE] line-clamp-2">{sub.resultText || "No text provided"}</p>
                    </div>
                    <div className="flex items-center gap-3 border-l border-[#2C2C29] pl-4">
                      <button
                        onClick={() => handleOverride(sub.id, "REJECT")}
                        disabled={!!overridingId}
                        className="px-4 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                      >
                        {overridingId === sub.id + "REJECT" && <Loader2 className="w-4 h-4 animate-spin" />}
                        REJECT
                      </button>
                      <button
                        onClick={() => handleOverride(sub.id, "APPROVE")}
                        disabled={!!overridingId}
                        className="px-5 py-2.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      >
                        {overridingId === sub.id + "APPROVE" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                        {isVerified ? "PAY & APPROVE" : "APPROVE"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Signature Moment: Swarm Complete Overlay */}
      {showSwarmComplete && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-[2px]">
          <div className="animate-in zoom-in-95 duration-700 bg-gradient-to-b from-[#10B981]/20 to-transparent p-12 rounded-full flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#10B981] flex items-center justify-center mb-6 shadow-[0_0_100px_rgba(16,185,129,0.8)] animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-[#0A0A0A]" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-widest drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">SWARM EXECUTED</h2>
            <p className="text-[#10B981] mt-2 font-mono uppercase font-bold tracking-widest text-sm">Settlement Finalized on Monad</p>
          </div>
        </div>
      )}
      
      {/* Payout Confirmation Modal */}
      {showPayoutOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#121211] border border-[#2C2C29] p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Release Escrow?</h3>
            {payoutStatusText ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
                <p className="text-sm text-[#F4F3EE] font-mono">{payoutStatusText}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#B1ADA1] mb-6">
                  You are about to release {formatMon((eligibleForPayout.length * parseFloat(task.rewardWeiPerWorker)).toString())} MON to {eligibleForPayout.length} verified nodes.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowPayoutOverlay(false)} className="flex-1 py-2.5 rounded-xl border border-[#3A3A36] text-[#F4F3EE] font-bold text-xs hover:bg-[#1A1A18]">CANCEL</button>
                  <button onClick={() => handleReleasePayout(true)} disabled={!!payingOutId} className="flex-1 py-2.5 rounded-xl bg-[#10B981] text-white font-bold text-xs hover:bg-[#34D399] flex justify-center items-center gap-2">
                    <Coins className="w-4 h-4" />
                    CONFIRM
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}