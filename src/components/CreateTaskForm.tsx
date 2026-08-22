/**
 * CreateTaskForm Component - $10,000 Studio Layout
 * Direct on-chain task creation with DeepSeek AI Co-Pilot, task templates, and real-time escrow simulation.
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useCreateTask } from "@/hooks/useCreateTask";
import { Sparkles, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Clock, Zap, ShieldCheck, FileText } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";
import { formatAddress } from "@/lib/utils";

const CATEGORIES = [
  "Testing",
  "Technical",
  "Design",
  "Knowledge",
  "Social",
  "Local",
];

const TASK_TEMPLATES = [
  {
    label: "📱 Mobile App QA Flow",
    title: "Test user onboarding flow on iOS / Android",
    description:
      "Please test creating a new account, complete the onboarding walkthrough, and report any bugs or UI friction points with severity level.",
    category: "Testing",
    skills: ["App Testing", "QA", "Mobile", "UI/UX"],
    rewardEth: "0.02",
    estimatedMinutes: 10,
  },
  {
    label: "🔍 Smart Contract Review",
    title: "Review escrow withdrawal logic for edge cases",
    description:
      "Inspect the escrow withdrawal checks-effects-interactions ordering and verify reentrancy protection on the payout function.",
    category: "Technical",
    skills: ["Solidity", "Security", "Auditing"],
    rewardEth: "0.05",
    estimatedMinutes: 15,
  },
  {
    label: "🎨 Landing Page Feedback",
    title: "First impression review for DeFi dashboard UI",
    description:
      "Look at our new hero section and pricing table on mobile and desktop. Provide 3 actionable aesthetic and clarity improvements.",
    category: "Design",
    skills: ["UI/UX", "Feedback", "Design"],
    rewardEth: "0.01",
    estimatedMinutes: 5,
  },
];

export function CreateTaskForm() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { createTask, state, error } = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Testing");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["QA", "Testing"]);
  const [rewardEth, setRewardEth] = useState("0.02");
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifySuccess, setClassifySuccess] = useState(false);

  function handleApplyTemplate(tmpl: (typeof TASK_TEMPLATES)[0]) {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setSkills(tmpl.skills);
    setRewardEth(tmpl.rewardEth);
    setEstimatedMinutes(tmpl.estimatedMinutes);
  }

  function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  async function handleAiClassify() {
    if (!description || description.length < 5) return;
    try {
      setIsClassifying(true);
      setClassifySuccess(false);
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const json = await res.json();
      if (json.data) {
        if (json.data.category) setCategory(json.data.category);
        if (json.data.skills && json.data.skills.length > 0) {
          setSkills(Array.from(new Set([...skills, ...json.data.skills])));
        }
        if (json.data.estimatedMinutes) {
          setEstimatedMinutes(json.data.estimatedMinutes);
        }
        setClassifySuccess(true);
        setTimeout(() => setClassifySuccess(false), 3000);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsClassifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !isConnected) return;

    try {
      const taskId = await createTask({
        title,
        description,
        category,
        skills,
        rewardEth,
        estimatedMinutes,
        requesterAddress: address,
      });

      router.push(`/tasks/${taskId}`);
    } catch {
      // Error handled by hook state
    }
  }

  const isSubmitting = [
    "saving",
    "awaiting_signature",
    "confirming",
    "syncing",
  ].includes(state);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form Controls (7 cols) */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        {/* Task Example Templates */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] shadow-sm">
          <div className="flex items-center gap-1.5 mb-2.5">
            <FileText className="w-3.5 h-3.5 text-[#C15F3C] dark:text-[#D97757]" />
            <span className="text-[11px] font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider">
              Example Task Templates
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {TASK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="text-left p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] hover:bg-[#F4F3EE] dark:hover:bg-[#242422] border border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/40 dark:hover:border-[#D97757]/40 transition-all text-xs text-[#1A1A18] dark:text-[#F4F3EE]"
              >
                <div className="font-medium truncate">{tmpl.label}</div>
                <div className="text-[#C15F3C] dark:text-[#D97757] text-[11px] font-mono mt-0.5 font-medium">
                  {tmpl.rewardEth} MON · ~{tmpl.estimatedMinutes}m
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-8 shadow-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B665E] dark:text-[#B1ADA1] mb-2">
              Task Title <span className="text-[#C15F3C]">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Test checkout flow on mobile browser"
              className="w-full px-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] focus:outline-none focus:border-[#C15F3C] dark:focus:border-[#D97757] text-sm transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B665E] dark:text-[#B1ADA1]">
                Task Instructions & Criteria <span className="text-[#C15F3C]">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={isClassifying || !description || description.length < 5}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#C15F3C]/10 hover:bg-[#C15F3C]/20 text-[#C15F3C] dark:text-[#D97757] border border-[#C15F3C]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isClassifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : classifySuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#4CAF50]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isClassifying ? "Analyzing..." : "Auto-Suggest (AI)"}</span>
              </button>
            </div>
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the human provider should do, what proof to submit, and any criteria..."
              className="w-full px-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] focus:outline-none focus:border-[#C15F3C] dark:focus:border-[#D97757] text-sm resize-none transition-all"
            />
          </div>

          {/* Category & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B665E] dark:text-[#B1ADA1] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] focus:outline-none focus:border-[#C15F3C] dark:focus:border-[#D97757] text-sm cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B665E] dark:text-[#B1ADA1] mb-2">
                Estimated Duration (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={240}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] focus:outline-none focus:border-[#C15F3C] dark:focus:border-[#D97757] text-sm font-mono"
              />
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B665E] dark:text-[#B1ADA1] mb-2">
              Required Skill Tags
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill tag (e.g. React, QA, Auditing)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] focus:outline-none focus:border-[#C15F3C] text-sm"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] hover:bg-[#ECEAE4] dark:hover:bg-[#2C2C29] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#6B665E] dark:text-[#B1ADA1] text-xs font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-[#C15F3C] font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Reward in MON Escrow Card */}
          <div className="p-5 rounded-2xl bg-[#C15F3C]/5 dark:bg-[#D97757]/8 border border-[#C15F3C]/20 dark:border-[#D97757]/25">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE] mb-1">
                  Escrow Reward Deposit (MON) <span className="text-[#C15F3C]">*</span>
                </label>
                <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
                  Locked in smart contract escrow. Released only upon your approval.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={rewardEth}
                  onChange={(e) => setRewardEth(e.target.value)}
                  className="w-32 px-4 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#C15F3C]/40 text-[#C15F3C] dark:text-[#D97757] font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#C15F3C]"
                />
                <span className="font-semibold text-[#1A1A18] dark:text-[#F4F3EE] text-sm">MON</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/30 text-[#C15F3C] dark:text-[#D97757] text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Transaction Error</div>
                <div className="text-xs mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Status Indicators during execution */}
          {isSubmitting && (
            <div className="p-4 rounded-xl bg-[#C15F3C]/10 border border-[#C15F3C]/25 flex items-center gap-3 text-[#C15F3C] dark:text-[#D97757] animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div className="text-sm font-medium">
                {state === "saving" && "Saving task parameters..."}
                {state === "awaiting_signature" &&
                  "Please sign the Escrow Lock transaction in your wallet..."}
                {state === "confirming" &&
                  "Waiting for Monad Testnet block confirmation..."}
                {state === "syncing" &&
                  "Verifying on-chain escrow state..."}
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2">
            {!isConnected ? (
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] text-center">
                <ShieldAlert className="w-6 h-6 text-[#C15F3C]" />
                <p className="text-sm font-medium text-[#1A1A18] dark:text-[#F4F3EE]">
                  Connect your MetaMask wallet to lock escrow reward and post this task
                </p>
                <WalletConnectButton />
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="luxury-btn-primary w-full py-4 text-sm font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Locking Escrow on Monad...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Lock {rewardEth} MON in Escrow & Post Task</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Right Column: Live Escrow Simulation & AI Intelligence Card (5 cols) */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        {/* Live Preview Card */}
        <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF] dark:border-[#2C2C29]">
            <span className="text-[11px] font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider">
              Live Escrow Card Preview
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50]">
              Pending Monad Lock
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                {category}
              </span>
              <span className="text-base font-semibold text-[#C15F3C] dark:text-[#D97757] font-mono">
                {rewardEth || "0.00"} MON
              </span>
            </div>

            <h4 className="font-semibold text-sm text-[#1A1A18] dark:text-[#F4F3EE] line-clamp-1">
              {title || "Untitled Micro-Task"}
            </h4>

            <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] line-clamp-2 leading-relaxed">
              {description || "Task instructions will appear here as you type..."}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DF] dark:border-[#2C2C29] text-[11px] text-[#8A857B] dark:text-[#7D7970]">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#B1ADA1]" />
                <span>~{estimatedMinutes} mins</span>
              </div>
              <span>by {address ? formatAddress(address) : "0x00...0000"}</span>
            </div>
          </div>
        </div>

        {/* Security Guarantees Pill Card */}
        <div className="p-5 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] dark:text-[#4CAF50]" />
            <span>Escrow Trust Guarantees</span>
          </div>

          <ul className="text-xs text-[#5C5851] dark:text-[#B1ADA1] space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#2E7D32] font-bold">✓</span>
              <span><strong>0% Protocol Fee</strong> — 100% of your deposit goes to the executing provider.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2E7D32] font-bold">✓</span>
              <span><strong>Instant Refund</strong> — You can cancel and withdraw funds before acceptance at any time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2E7D32] font-bold">✓</span>
              <span><strong>On-Chain Audit</strong> — All state transitions signed via Monad smart contract events.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
