"use client";
/**
 * Swarm Task Creator — /swarm/new
 * Post a new Human Swarm task: N workers, reward per worker, AI auto-classify & quick presets
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowLeft, Users, Sparkles, Plus, X, Loader2, Bookmark, Check, ShieldCheck, Zap, Laptop, Search, Palette, Server } from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { parseEther } from "viem";

const CATEGORIES = ["Testing", "Technical", "Design", "Knowledge", "Social", "Local"];

interface SwarmTemplate {
  id: string;
  label: string;
  icon: string;
  badge: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  requirements: string[];
  rewardPerWorker: string;
  maxWorkers: number;
  estimatedMinutes: number;
}

const SWARM_TEMPLATES: SwarmTemplate[] = [
  {
    id: "dex_qa",
    label: "DEX Swap & Liquidity QA",
    icon: "zap",
    badge: "Most Popular",
    title: "Test Monad DEX swap & liquidity flow across devices",
    description: "Connect wallet, execute a test token swap on Monad testnet, attempt to add liquidity, and document any UI glitches, transaction timeouts, or failed states across your specific browser/device.",
    category: "Testing",
    skills: ["DEX", "QA", "Mobile/Desktop", "Monad Testnet"],
    requirements: [
      "Connect wallet on Monad Testnet",
      "Execute test swap with custom slippage",
      "Try adding test liquidity to pool",
      "Report transaction speed & UI friction points",
      "Attach transaction hash or screenshot proof"
    ],
    rewardPerWorker: "0.01",
    maxWorkers: 5,
    estimatedMinutes: 5,
  },
  {
    id: "audit_swarm",
    label: "Crowdsourced Smart Contract Audit",
    icon: "search",
    badge: "Security",
    title: "Crowdsourced security & invariant check for Escrow contract",
    description: "Inspect the HumanTaskEscrow smart contract for reentrancy vectors, integer overflow/underflow, access control bypasses, and edge-case cancellation bugs.",
    category: "Technical",
    skills: ["Solidity", "Security", "Auditing", "Invariants"],
    requirements: [
      "Review checks-effects-interactions ordering in payout function",
      "Verify state transitions and access control modifiers",
      "Test edge cases around task cancellation & timeout triggers",
      "Provide reproduction script or detailed vulnerability note"
    ],
    rewardPerWorker: "0.025",
    maxWorkers: 3,
    estimatedMinutes: 15,
  },
  {
    id: "ux_friction",
    label: "DeFi UI/UX Friction Audit",
    icon: "palette",
    badge: "Design",
    title: "Crowdsourced UX friction audit for Monad staking dashboard",
    description: "Review the staking dashboard onboarding, APR calculators, and claim modals on desktop and mobile. Provide 3 prioritized UX improvements.",
    category: "Design",
    skills: ["UI/UX", "Feedback", "Design", "Friction Audit"],
    requirements: [
      "Review hero section and staking APR breakdown",
      "Check mobile viewport responsiveness & button tap targets",
      "List top 3 friction points with suggested improvements",
      "Attach annotated screenshots"
    ],
    rewardPerWorker: "0.01",
    maxWorkers: 4,
    estimatedMinutes: 8,
  },
  {
    id: "rpc_benchmark",
    label: "RPC Latency & Node Benchmark",
    icon: "server",
    badge: "Infra",
    title: "Geographic latency & consensus verification on Monad RPCs",
    description: "Send 10 batch eth_getBlockByNumber and eth_call requests to testnet RPC from your geographic region. Record response latency and block consistency.",
    category: "Technical",
    skills: ["RPC", "Benchmarking", "Latency", "Infrastructure"],
    requirements: [
      "Run latency benchmark against public Monad testnet RPC",
      "Measure time-to-first-byte and throughput",
      "Report your region/ISP and average round-trip ping",
      "Provide raw ping/curl output logs"
    ],
    rewardPerWorker: "0.015",
    maxWorkers: 6,
    estimatedMinutes: 5,
  }
];

export default function SwarmNewPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Testing");
  const [rewardPerWorker, setRewardPerWorker] = useState("0.01");
  const [maxWorkers, setMaxWorkers] = useState(5);
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newReq, setNewReq] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMon = (parseFloat(rewardPerWorker || "0") * maxWorkers).toFixed(4);

  function applyTemplate(tmpl: SwarmTemplate) {
    setSelectedTemplate(tmpl.id);
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setRewardPerWorker(tmpl.rewardPerWorker);
    setMaxWorkers(tmpl.maxWorkers);
    setEstimatedMinutes(tmpl.estimatedMinutes);
    setRequirements([...tmpl.requirements]);
    setSkills([...tmpl.skills]);
  }

  async function handleAutoSuggest() {
    if (!description.trim()) return;
    setAutoLoading(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const json = await res.json();
      if (json.data) {
        if (json.data.category) setCategory(json.data.category);
        if (json.data.skills?.length) setSkills(json.data.skills);
        if (json.data.estimatedMinutes) setEstimatedMinutes(json.data.estimatedMinutes);
        if (json.data.requirements?.length) setRequirements(json.data.requirements);
      }
    } catch {} finally { setAutoLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      let rewardWeiPerWorker: string;
      try {
        rewardWeiPerWorker = parseEther(rewardPerWorker as `${number}`).toString();
      } catch {
        setError("Invalid reward amount");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          skills,
          requirements,
          rewardWeiPerWorker,
          estimatedMinutes,
          maxWorkers,
          requesterAddress: address,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Failed to create swarm task");
        return;
      }
      router.push("/swarm/" + json.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create swarm task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/swarm" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A857B] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Swarm
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-[#C15F3C] dark:text-[#D97757] font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Multi-Escrow Monad Swarm</span>
        </div>
      </div>

      {/* Quick Presets Carousel */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#C15F3C]" />
            Quick Presets / Templates
          </span>
          <span className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">
            Click to pre-fill showcase workflow
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SWARM_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                type="button"
                key={tmpl.id}
                onClick={() => applyTemplate(tmpl)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#C15F3C]/5 dark:bg-[#D97757]/10 border-[#C15F3C] dark:border-[#D97757] shadow-xs"
                    : "bg-[#FFFFFF] dark:bg-[#1E1E1C] border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] flex items-center justify-center shrink-0">
                      {tmpl.id === "dex_qa" && <Zap className="w-3.5 h-3.5" />}
                      {tmpl.id === "audit_swarm" && <Search className="w-3.5 h-3.5" />}
                      {tmpl.id === "ux_friction" && <Palette className="w-3.5 h-3.5" />}
                      {tmpl.id === "rpc_benchmark" && <Server className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE] block leading-tight">
                        {tmpl.label}
                      </span>
                      <span className="text-[10px] text-[#8A857B] dark:text-[#7D7970]">
                        {tmpl.category} · {tmpl.maxWorkers} workers
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                    {tmpl.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DF]/60 dark:border-[#2C2C29]/60 text-[10px]">
                  <span className="text-[#C15F3C] dark:text-[#D97757] font-mono font-medium">
                    {tmpl.rewardPerWorker} MON/worker
                  </span>
                  <span className="text-[#8A857B] dark:text-[#7D7970] font-mono">
                    Pool: {(parseFloat(tmpl.rewardPerWorker) * tmpl.maxWorkers).toFixed(3)} MON
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[#C15F3C]" />
            <h1 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Post a Swarm Task</h1>
          </div>
          <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">Multiple workers execute in parallel. The Swarm Engine clusters findings into a consensus report.</p>
        </div>

        {!isConnected ? (
          <WalletConnectButton />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">Task Title <span className="text-[#C15F3C]">*</span></label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Test checkout flow across browsers" className="w-full px-4 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] text-xs focus:outline-none focus:border-[#C15F3C]" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1]">Description <span className="text-[#C15F3C]">*</span></label>
                <button type="button" onClick={handleAutoSuggest} disabled={!description.trim() || autoLoading} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] text-[10px] font-semibold hover:bg-[#C15F3C]/20 disabled:opacity-50 transition-colors">
                  {autoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Auto-Suggest (AI)
                </button>
              </div>
              <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what workers need to do..." className="w-full px-4 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] text-xs focus:outline-none focus:border-[#C15F3C] resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs focus:outline-none focus:border-[#C15F3C]">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">Estimated Time (min)</label>
                <input type="number" min={1} max={120} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs focus:outline-none focus:border-[#C15F3C]" />
              </div>
            </div>

            {/* Worker slots + Reward */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-4">
              <h3 className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE] flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#C15F3C]" /> Swarm Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">Max Workers <span className="text-[#C15F3C]">*</span></label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={2} max={20} value={maxWorkers} onChange={(e) => setMaxWorkers(Number(e.target.value))} className="flex-1 accent-[#C15F3C]" />
                    <span className="w-10 text-center text-sm font-bold text-[#C15F3C] dark:text-[#D97757]">{maxWorkers}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-[#B1ADA1] mt-0.5"><span>2</span><span>20</span></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-1.5">Reward Per Worker (MON) <span className="text-[#C15F3C]">*</span></label>
                  <input type="number" step="0.001" min="0.001" value={rewardPerWorker} onChange={(e) => setRewardPerWorker(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs focus:outline-none focus:border-[#C15F3C]" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#C15F3C]/5 border border-[#C15F3C]/15">
                <span className="text-xs text-[#8A857B] dark:text-[#7D7970]">Total Escrow Pool ({maxWorkers} workers)</span>
                <span className="text-base font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">{totalMon} MON</span>
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-2">Acceptance Criteria (for auto-verification)</label>
              <div className="space-y-1.5">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36]">
                    <span className="text-[#2E7D32] dark:text-[#4CAF50]">✓</span>
                    <span className="flex-1 text-xs text-[#1A1A18] dark:text-[#F4F3EE]">{req}</span>
                    <button type="button" onClick={() => setRequirements(requirements.filter((_, i) => i !== idx))} className="text-[#B1ADA1] hover:text-[#C15F3C] transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newReq} onChange={(e) => setNewReq(e.target.value)} placeholder="Add a requirement..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newReq.trim()) { setRequirements([...requirements, newReq.trim()]); setNewReq(""); } } }} className="flex-1 px-3.5 py-2 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-xs text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] focus:outline-none focus:border-[#C15F3C]" />
                  <button type="button" onClick={() => { if (newReq.trim()) { setRequirements([...requirements, newReq.trim()]); setNewReq(""); } }} className="p-2 rounded-xl bg-[#C15F3C]/10 text-[#C15F3C] hover:bg-[#C15F3C]/20 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-[#6B665E] dark:text-[#B1ADA1] mb-2">Required Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F4F3EE] dark:bg-[#242422] text-xs text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                    {s}<button type="button" onClick={() => setSkills(skills.filter((sk) => sk !== s))} className="hover:text-[#C15F3C]"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add skill..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } } }} className="flex-1 px-3.5 py-2 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-xs text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] focus:outline-none focus:border-[#C15F3C]" />
                <button type="button" onClick={() => { if (newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } }} className="p-2 rounded-xl bg-[#C15F3C]/10 text-[#C15F3C] hover:bg-[#C15F3C]/20"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {error && <div className="p-3 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] text-xs">{error}</div>}

            <button type="submit" disabled={loading || !title.trim() || !description.trim()} className="w-full py-3.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Swarm Task...</span></>) : (<><Users className="w-4 h-4" /><span>Post Swarm Task ({totalMon} MON total pool)</span></>)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}