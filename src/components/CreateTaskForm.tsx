/**
 * CreateTaskForm Component
 * Full form for creating on-chain micro-tasks with AI classification assistance
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useCreateTask } from "@/hooks/useCreateTask";
import { Sparkles, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";

const CATEGORIES = [
  "Testing",
  "Technical",
  "Design",
  "Knowledge",
  "Social",
  "Local",
];

const PRESET_TEMPLATES = [
  {
    label: "📱 Test My Mobile App (Demo Category)",
    title: "Test user onboarding flow on iOS / Android",
    description:
      "Please install the latest build, test creating a new account, complete the onboarding walkthrough, and report any bugs or friction points with severity level.",
    category: "Testing",
    skills: ["App Testing", "QA", "Mobile", "UI/UX"],
    rewardEth: "0.05",
    estimatedMinutes: 10,
  },
  {
    label: "🔍 Smart Contract Quick Review",
    title: "Review escrow withdrawal logic for edge cases",
    description:
      "Inspect the escrow withdrawal checks-effects-interactions ordering and verify reentrancy protection on the payout function.",
    category: "Technical",
    skills: ["Solidity", "Security", "Auditing"],
    rewardEth: "0.1",
    estimatedMinutes: 15,
  },
  {
    label: "🎨 Quick Landing Page Feedback",
    title: "First impression review for DeFi dashboard UI",
    description:
      "Look at our new hero section and pricing table on mobile and desktop. Provide 3 actionable aesthetic and clarity improvements.",
    category: "Design",
    skills: ["UI/UX", "Feedback", "Design"],
    rewardEth: "0.02",
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
  const [rewardEth, setRewardEth] = useState("0.05");
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifySuccess, setClassifySuccess] = useState(false);

  function handleApplyTemplate(template: (typeof PRESET_TEMPLATES)[0]) {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setSkills(template.skills);
    setRewardEth(template.rewardEth);
    setEstimatedMinutes(template.estimatedMinutes);
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      {/* Preset Quick Templates */}
      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40">
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider block mb-2">
          ⚡ Quick Demo Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600/50 transition-all text-xs text-slate-200"
            >
              <div className="font-medium truncate">{tmpl.label}</div>
              <div className="text-purple-400 text-[11px] font-mono mt-0.5">
                {tmpl.rewardEth} MON · ~{tmpl.estimatedMinutes}m
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Task Title <span className="text-purple-400">*</span>
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Test checkout flow on mobile browser"
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-200">
              Task Description & Instructions <span className="text-purple-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleAiClassify}
              disabled={isClassifying || !description || description.length < 5}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isClassifying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : classifySuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
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
            placeholder="Describe what the human provider should do, what output to submit, and any criteria..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
          />
          <span className="text-[11px] text-slate-500 block mt-1">
            Tip: Click &apos;Auto-Suggest (AI)&apos; to classify category and skills automatically.
          </span>
        </div>

        {/* Category & Estimated Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Estimated Duration (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={240}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>

        {/* Skills Required */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Skill Tags
          </label>
          <div className="flex gap-2 mb-2">
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
              placeholder="Add skill (e.g. React, App Testing, Bug Finding)"
              className="flex-1 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-white font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Reward in MON */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-bold text-white mb-1">
                Escrow Reward Amount (MON) <span className="text-purple-400">*</span>
              </label>
              <p className="text-xs text-slate-400">
                Locked securely in the smart contract. Released only upon your approval.
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
                className="w-32 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-purple-700/60 text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="font-bold text-purple-300">MON</span>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Transaction Error</div>
              <div className="text-xs text-red-300 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Status Indicators during execution */}
        {isSubmitting && (
          <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-700/60 flex items-center gap-3 text-purple-200 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400 shrink-0" />
            <div className="text-sm">
              {state === "saving" && "Saving initial task record..."}
              {state === "awaiting_signature" &&
                "Please sign the Escrow Lock transaction in your wallet..."}
              {state === "confirming" &&
                "Waiting for Monad Testnet block confirmation..."}
              {state === "syncing" &&
                "Verifying on-chain state and finalizing task..."}
            </div>
          </div>
        )}

        {/* Submit CTA */}
        <div className="pt-2">
          {!isConnected ? (
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
              <p className="text-sm text-slate-300">
                Connect your wallet to lock escrow reward and post this task
              </p>
              <WalletConnectButton />
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing On-Chain...</span>
                </>
              ) : (
                <>
                  <span>Lock {rewardEth} MON in Escrow & Post Task</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
