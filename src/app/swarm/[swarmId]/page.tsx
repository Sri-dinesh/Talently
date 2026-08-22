"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { 
  ArrowLeft, Users, Clock, Loader2, Send, ShieldCheck, 
  Coins, Sparkles, CheckCircle2, AlertTriangle, X, Zap,
  ExternalLink, RotateCcw, Check, RefreshCw, LayoutGrid
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
  const [viewMode, setViewMode] = useState<"GRAPH" | "MANUAL">("GRAPH");

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
  const [rejoining, setRejoining] = useState(false);
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

  const reviewQueue = submissions.filter(s => {
    const st = s.status?.toUpperCase();
    return st === "SUBMITTED" || st === "VERIFIED";
  });
  const eligibleForPayout = submissions.filter(s => s.status === "VERIFIED" || (s.status === "SUBMITTED" && s.submittedAt));
  const eligibleForRefund = submissions.filter(s => s.status === "REJECTED" || s.status === "FLAGGED");
  const paidOutCount = submissions.filter(s => s.status === "PAID_OUT").length;
  const refundedCount = submissions.filter(s => s.status === "REFUNDED").length;
  const verifiedCount = submissions.filter(s => s.status === "VERIFIED" || s.status === "PAID_OUT").length;
  const pendingSubmissions = reviewQueue;

  const showSwarmComplete = task?.status === "COMPLETED" && paidOutCount > 0 && paidOutCount === verifiedCount;

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

  async function handleRejoin() {
    if (!task || !userAddress) return;
    setRejoining(true);
    try {
      const res = await fetch("/api/swarm/" + task.id + "/rejoin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerAddress: userAddress }),
      });
      const json = await res.json();
      if (json.data) {
        setTask(json.data);
        setSubmissions(json.data.submissions || []);
      }
      // Clear form inputs for fresh entry
      setResultText("");
      setResultAttachmentUrl("");
    } catch (err) {
      console.error("Rejoin error:", err);
    } finally {
      setRejoining(false);
    }
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
    setSelectedNode(null);
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
        let hash: `0x${string}` | "" = "";
        if (walletClient && publicClient && target?.workerAddress) {
          try {
            hash = await walletClient.sendTransaction({
              to: target.workerAddress as `0x${string}`,
              value: BigInt(task.rewardWeiPerWorker),
            });
            await publicClient.waitForTransactionReceipt({ hash });
          } catch (txErr: any) {
            console.error("On-chain payout transfer failed:", txErr);
            alert(`Transfer failed: ${txErr?.shortMessage || txErr?.message || "Please check wallet balance on Monad"}`);
            return;
          }
        }

        // Direct record payout
        await fetch("/api/swarm/" + task.id + "/payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, requesterAddress: userAddress, txHash: hash }),
        });
      } else {
        // REJECT
        await fetch("/api/swarm/" + task.id + "/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, action, requesterAddress: userAddress }),
        });
      }
      await fetchTask();
    } catch (err) {
      console.error(err);
      alert("Action failed. Check network connection.");
    } finally {
      setOverridingId(null);
    }
  }

  async function handleReleasePayout(payoutAll = true) {
    if (!task || !userAddress) return;
    setPayingOutId(payoutAll ? "all" : "single");
    setPayoutStatusText("Signing transfer on Monad...");
    
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

      setPayoutSuccessMsg("Payouts released successfully on Monad");
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

  const selectedSubmission = selectedNode?.type === "human" 
    ? submissions.find(s => s.id === selectedNode.data.submissionId)
    : null;

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] font-sans flex flex-col text-[#F4F3EE]">
      
      {/* Top Universal Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#121211]/90 backdrop-blur-md border-b border-[#2C2C29] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/swarm" 
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1A1A18] hover:bg-[#2C2C29] border border-[#2C2C29] rounded-xl text-xs font-mono text-[#B1ADA1] hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>SWARM HUB</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-[#F4F3EE] max-w-[200px] truncate">{task.title}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C15F3C]/20 text-[#C15F3C] border border-[#C15F3C]/30">
              {formatMon(task.rewardWeiPerWorker)} MON / Node
            </span>
          </div>
        </div>

        {/* Center: Dual UI Mode Switcher (Graph vs Manual) */}
        <div className="flex items-center bg-[#0A0A0A] p-1 rounded-xl border border-[#242422] shadow-inner">
          <button
            onClick={() => setViewMode("GRAPH")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all
              ${viewMode === "GRAPH" ? "bg-[#C15F3C] text-white shadow-[0_0_12px_rgba(193,95,60,0.4)]" : "text-[#8A857B] hover:text-white"}
            `}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>VISUAL GRAPH</span>
          </button>
          <button
            onClick={() => setViewMode("MANUAL")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all
              ${viewMode === "MANUAL" ? "bg-[#10B981] text-[#0A0A0A] font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "text-[#8A857B] hover:text-white"}
            `}
          >
            <Users className="w-3.5 h-3.5" />
            <span>MANUAL CONSOLE</span>
          </button>
        </div>

        {/* Right: Connect Wallet */}
        <div>
          <WalletConnectButton />
        </div>
      </header>

      {/* VIEW 1: INTERACTIVE SWARM GRAPH */}
      {viewMode === "GRAPH" && (
        <div className="w-full flex-1 relative overflow-hidden min-h-[calc(100vh-65px)]">
          {/* Main Background Graph */}
          <div className="absolute inset-0 z-0">
            <SwarmGraph 
              task={task} 
              submissions={submissions} 
              onNodeClick={(node) => setSelectedNode(node)} 
            />
          </div>

          {/* Left Panel: Swarm Quick Info */}
          <div className="absolute top-6 left-4 w-[300px] bg-[#121211]/90 backdrop-blur-md border border-[#2C2C29] rounded-2xl p-5 z-10 flex flex-col gap-4 pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C15F3C]" />
              <h1 className="text-[#F4F3EE] font-bold text-base tracking-tight leading-tight">Swarm Graph Engine</h1>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#8A857B] tracking-wider font-mono">Task Target</span>
              <p className="text-xs text-[#F4F3EE] font-medium leading-relaxed">{task.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#1A1A18] rounded-xl border border-[#3A3A36]">
                <span className="text-[10px] uppercase font-bold text-[#8A857B] font-mono">Total Pool</span>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">
                    {formatMon((BigInt(task.rewardWeiPerWorker) * BigInt(task.maxWorkers)).toString())} MON
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-[#1A1A18] rounded-xl border border-[#3A3A36]">
                <span className="text-[10px] uppercase font-bold text-[#8A857B] font-mono">Active Nodes</span>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs font-mono font-bold text-[#3B82F6]">{slotsUsed}/{task.maxWorkers}</span>
                </div>
              </div>
            </div>

            {/* Actions for Worker & Requester */}
            <div className="flex flex-col gap-2 pt-1">
              {canJoin && (
                <button 
                  onClick={handleJoin}
                  disabled={joinState === "joining" || !isConnected}
                  className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-[#C15F3C] text-white hover:bg-[#D97757] disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(193,95,60,0.3)]"
                >
                  {joinState === "joining" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isConnected ? "INJECT NODE (JOIN SWARM)" : "CONNECT WALLET"}
                </button>
              )}

              {hasJoined && mySubmission?.status !== "PAID_OUT" && (
                <button
                  onClick={handleRejoin}
                  disabled={rejoining}
                  className="w-full py-2 rounded-xl font-mono font-bold text-xs bg-[#1A1A18] hover:bg-[#2C2C29] text-[#10B981] border border-[#10B981]/30 transition-all flex items-center justify-center gap-1.5"
                >
                  {rejoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  REJOIN / RE-SUBMIT PROOF
                </button>
              )}

              {isRequester && eligibleForPayout.length > 0 && paidOutCount < eligibleForPayout.length && (
                <button
                  onClick={() => setShowPayoutOverlay(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-[#10B981] text-[#0A0A0A] hover:bg-[#34D399] transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-mono"
                >
                  <Coins className="w-4 h-4" />
                  PAY ALL NODES ({eligibleForPayout.length})
                </button>
              )}

              {isRequester && eligibleForRefund.length > 0 && (
                <button
                  onClick={handleRefund}
                  disabled={!!refundingId}
                  className="w-full py-2 rounded-xl font-bold text-xs bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 transition-all flex items-center justify-center gap-1.5"
                >
                  {refundingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  REFUND UNCLAIMED ESCROW
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Node Inspector / Submission */}
          {(hasJoined || selectedSubmission) && (
            <div className="absolute top-6 right-4 w-[340px] max-h-[calc(100vh-140px)] overflow-y-auto bg-[#121211]/95 backdrop-blur-xl border border-[#3A3A36] rounded-2xl shadow-2xl z-20 pointer-events-auto">
              <div className="sticky top-0 bg-[#121211]/95 px-4 py-3 border-b border-[#2C2C29] flex justify-between items-center">
                <h2 className="text-[#F4F3EE] font-bold text-xs tracking-wide flex items-center gap-2 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#C15F3C]" />
                  NODE INSPECTOR
                </h2>
                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-[#2C2C29] rounded-md transition-colors text-[#8A857B]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Form if own slot is in executing status */}
                {hasJoined && mySubmission?.status === "EXECUTING" && (!selectedSubmission || selectedSubmission.id === mySubmission.id) && (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="p-2.5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl">
                      <span className="text-[#3B82F6] text-xs font-mono font-semibold flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                        NODE ASSIGNED. SUBMIT PROOF.
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8A857B] uppercase tracking-wider font-mono">Execution Proof / Findings</label>
                      <textarea
                        value={resultText}
                        onChange={e => setResultText(e.target.value)}
                        required
                        rows={4}
                        className="w-full p-2.5 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl text-xs text-[#F4F3EE] focus:border-[#C15F3C] outline-none font-mono"
                        placeholder="Enter verified output or evidence..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8A857B] uppercase tracking-wider font-mono">Severity / Category</label>
                      <select
                        value={resultSeverity}
                        onChange={(e) => setResultSeverity(e.target.value as any)}
                        className="w-full p-2 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl text-xs text-[#F4F3EE] font-mono outline-none"
                      >
                        <option value="Low">Low Severity / Verified</option>
                        <option value="Medium">Medium Severity</option>
                        <option value="High">High Severity / Critical</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submitState === "submitting"}
                      className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-[#10B981] text-[#0A0A0A] hover:bg-[#34D399] disabled:opacity-50 transition-all flex justify-center items-center gap-2 font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      {submitState === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      SUBMIT EXECUTION PROOF
                    </button>
                  </form>
                )}

                {/* Inspecting node submission */}
                {selectedSubmission && selectedSubmission.status !== "EXECUTING" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#8A857B] uppercase block">Worker</span>
                      <span className="text-[#F4F3EE] bg-[#1A1A18] px-2 py-1 rounded block border border-[#2C2C29] mt-0.5">
                        {formatAddress(selectedSubmission.workerAddress)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#8A857B] uppercase block">Submitted Payload</span>
                      <div className="text-[#B1ADA1] bg-[#0A0A0A] p-2.5 rounded-xl border border-[#2C2C29] mt-0.5 break-words">
                        {selectedSubmission.resultText || "No text provided"}
                      </div>
                    </div>

                    {isRequester && (selectedSubmission.status === "SUBMITTED" || selectedSubmission.status === "VERIFIED") && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2C2C29]">
                        <button
                          onClick={() => handleOverride(selectedSubmission.id, "REJECT")}
                          disabled={!!overridingId}
                          className="py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1"
                        >
                          {overridingId === selectedSubmission.id + "REJECT" ? <Loader2 className="w-3 h-3 animate-spin" /> : "REJECT"}
                        </button>
                        <button
                          onClick={() => handleOverride(selectedSubmission.id, "APPROVE")}
                          disabled={!!overridingId}
                          className="py-2 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        >
                          {overridingId === selectedSubmission.id + "APPROVE" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                          PAY & TRANSFER
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Action Center (for Requester Reviews) */}
          {showActionCenter && isRequester && reviewQueue.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30 pointer-events-auto">
              <div className="bg-[#161615]/95 backdrop-blur-xl border-2 border-[#10B981]/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#2C2C29] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="font-mono font-bold text-xs text-[#F4F3EE]">
                      WORKER REVIEWS PENDING ({reviewQueue.length})
                    </span>
                  </div>
                  <button
                    onClick={() => handleReleasePayout(true)}
                    className="px-3 py-1 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-mono font-black text-xs rounded-lg flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  >
                    <Coins className="w-3 h-3" />
                    PAY ALL
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {reviewQueue.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between bg-[#10100F] p-3 rounded-xl border border-[#242422] gap-3">
                      <div className="flex-1 min-w-0 font-mono text-xs">
                        <span className="text-[#8A857B] text-[10px] block">Worker: {formatAddress(sub.workerAddress)}</span>
                        <p className="text-[#F4F3EE] truncate text-xs mt-0.5">{sub.resultText || "Payload submitted"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOverride(sub.id, "REJECT")}
                          disabled={!!overridingId}
                          className="px-3 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-lg text-xs font-mono font-bold"
                        >
                          REJECT
                        </button>
                        <button
                          onClick={() => handleOverride(sub.id, "APPROVE")}
                          disabled={!!overridingId}
                          className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] rounded-lg text-xs font-mono font-black flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        >
                          {overridingId === sub.id + "APPROVE" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                          PAY & TRANSFER ({formatMon(task.rewardWeiPerWorker)} MON)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MANUAL CONSOLE & USABILITY VIEW */}
      {viewMode === "MANUAL" && (
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6 flex-1">
          
          {/* Top Swarm Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8A857B]">Escrow Reward / Worker</span>
              <div className="flex items-center gap-2 mt-2">
                <Coins className="w-5 h-5 text-[#10B981]" />
                <span className="text-xl font-mono font-bold text-[#10B981]">{formatMon(task.rewardWeiPerWorker)} MON</span>
              </div>
              <span className="text-[10px] text-[#8A857B] font-mono mt-2">Instant on-chain transfer to worker</span>
            </div>

            <div className="p-4 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8A857B]">Worker Nodes</span>
              <div className="flex items-center gap-2 mt-2">
                <Users className="w-5 h-5 text-[#3B82F6]" />
                <span className="text-xl font-mono font-bold text-[#3B82F6]">{slotsUsed} / {task.maxWorkers} Filled</span>
              </div>
              <span className="text-[10px] text-[#8A857B] font-mono mt-2">{slotsAvailable} slots remaining</span>
            </div>

            <div className="p-4 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8A857B]">Settlement Status</span>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck className="w-5 h-5 text-[#836EF9]" />
                <span className="text-base font-mono font-bold text-[#836EF9]">
                  {paidOutCount} Paid · {reviewQueue.length} Pending
                </span>
              </div>
              <span className="text-[10px] text-[#8A857B] font-mono mt-2">Monad Testnet (Chain ID 10143)</span>
            </div>
          </div>

          {/* Worker Join / Rejoin Action Box */}
          <div className="p-5 bg-[#121211] border border-[#2C2C29] rounded-2xl shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C2C29] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#F4F3EE] flex items-center gap-2 font-mono">
                  <Zap className="w-4 h-4 text-[#C15F3C]" />
                  WORKER EXECUTION HUB
                </h2>
                <p className="text-xs text-[#8A857B] mt-0.5">
                  Join as a parallel worker, execute the task, and receive {formatMon(task.rewardWeiPerWorker)} MON escrow directly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canJoin && (
                  <button
                    onClick={handleJoin}
                    disabled={joinState === "joining" || !isConnected}
                    className="px-4 py-2 bg-[#C15F3C] hover:bg-[#D97757] text-white font-mono font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(193,95,60,0.3)] flex items-center gap-1.5"
                  >
                    {joinState === "joining" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    JOIN AS WORKER
                  </button>
                )}

                {hasJoined && (
                  <button
                    onClick={handleRejoin}
                    disabled={rejoining}
                    className="px-4 py-2 bg-[#1A1A18] hover:bg-[#2C2C29] text-[#10B981] border border-[#10B981]/30 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    {rejoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    REJOIN / RE-SUBMIT PROOF
                  </button>
                )}
              </div>
            </div>

            {/* If Worker is currently Executing */}
            {hasJoined && mySubmission?.status === "EXECUTING" && (
              <form onSubmit={handleSubmit} className="p-4 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl flex flex-col gap-3">
                <span className="text-xs font-mono font-bold text-[#3B82F6] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                  Your slot is ACTIVE. Enter your execution payload below:
                </span>
                <textarea
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  required
                  rows={3}
                  className="w-full p-3 bg-[#121211] border border-[#2C2C29] rounded-xl text-xs text-[#F4F3EE] font-mono outline-none focus:border-[#10B981]"
                  placeholder="Provide proof of execution, finding, or test result..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitState === "submitting"}
                    className="px-5 py-2.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-mono font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    {submitState === "submitting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    SUBMIT PROOF & CLAIM REWARD
                  </button>
                </div>
              </form>
            )}

            {/* If Worker has already submitted */}
            {hasJoined && mySubmission?.status !== "EXECUTING" && (
              <div className="p-4 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded font-bold text-[11px]
                    ${mySubmission?.status === "PAID_OUT" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40"}
                  `}>
                    STATUS: {mySubmission?.status}
                  </span>
                  <span className="text-[#8A857B] truncate max-w-md">Proof: "{mySubmission?.resultText || "N/A"}"</span>
                </div>
                {mySubmission?.status === "PAID_OUT" && (
                  <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> PAID ON-CHAIN
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Worker Submissions Management Table */}
          <div className="p-5 bg-[#121211] border border-[#2C2C29] rounded-2xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2C2C29] pb-3">
              <h2 className="text-base font-bold text-[#F4F3EE] font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3B82F6]" />
                SWARM SUBMISSIONS & TRANSFERS ({submissions.length})
              </h2>
              {isRequester && eligibleForPayout.length > 0 && (
                <button
                  onClick={() => handleReleasePayout(true)}
                  className="px-4 py-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-mono font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                >
                  <Coins className="w-3.5 h-3.5" />
                  PAY ALL ELIGIBLE ({eligibleForPayout.length})
                </button>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#8A857B] text-xs font-mono">
                No workers have joined this swarm yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {submissions.map((sub, idx) => {
                  const isPaid = sub.status === "PAID_OUT";
                  const isPending = sub.status === "SUBMITTED" || sub.status === "VERIFIED";

                  return (
                    <div 
                      key={sub.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all
                        ${isPaid ? "bg-[#10B981]/5 border-[#10B981]/30" : "bg-[#0A0A0A] border-[#242422]"}
                      `}
                    >
                      <div className="flex flex-col gap-1.5 font-mono text-xs flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8A857B] font-bold">SLOT #{idx + 1}</span>
                          <span className="text-[#F4F3EE] bg-[#1A1A18] px-2 py-0.5 rounded border border-[#2C2C29]">
                            {formatAddress(sub.workerAddress)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold
                            ${isPaid ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" : isPending ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40" : "bg-[#2C2C29] text-[#8A857B]"}
                          `}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-[#B1ADA1] text-xs mt-1 bg-[#121211] p-2.5 rounded-lg border border-[#242422] break-words">
                          {sub.resultText || "No proof text submitted yet."}
                        </p>
                      </div>

                      {/* Requester Transfer & Review Controls */}
                      <div className="flex items-center gap-2">
                        {isRequester && isPending && (
                          <>
                            <button
                              onClick={() => handleOverride(sub.id, "REJECT")}
                              disabled={!!overridingId}
                              className="px-3 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-xs font-mono font-bold"
                            >
                              REJECT
                            </button>
                            <button
                              onClick={() => handleOverride(sub.id, "APPROVE")}
                              disabled={!!overridingId}
                              className="px-4 py-2 bg-[#10B981] hover:bg-[#34D399] text-[#0A0A0A] font-mono font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            >
                              {overridingId === sub.id + "APPROVE" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                              PAY & TRANSFER ({formatMon(task.rewardWeiPerWorker)} MON)
                            </button>
                          </>
                        )}

                        {isPaid && (
                          <div className="flex items-center gap-1 text-[#10B981] font-mono font-bold text-xs bg-[#10B981]/10 px-3 py-1.5 rounded-xl border border-[#10B981]/30">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>TRANSFERRED ON-CHAIN</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Payout Confirmation Modal */}
      {showPayoutOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#121211] border border-[#2C2C29] p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 font-mono">Release Escrow Payouts?</h3>
            {payoutStatusText ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
                <p className="text-xs text-[#F4F3EE] font-mono text-center">{payoutStatusText}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#B1ADA1] mb-6 font-mono leading-relaxed">
                  You are about to transfer {formatMon((eligibleForPayout.length * parseFloat(task.rewardWeiPerWorker)).toString())} MON directly to {eligibleForPayout.length} worker nodes on Monad Testnet.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowPayoutOverlay(false)} className="flex-1 py-2 rounded-xl border border-[#3A3A36] text-[#F4F3EE] font-bold text-xs font-mono hover:bg-[#1A1A18]">
                    CANCEL
                  </button>
                  <button 
                    onClick={() => handleReleasePayout(true)} 
                    disabled={!!payingOutId} 
                    className="flex-1 py-2 rounded-xl bg-[#10B981] text-[#0A0A0A] font-black text-xs font-mono hover:bg-[#34D399] flex justify-center items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
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