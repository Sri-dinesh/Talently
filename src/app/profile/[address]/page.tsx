/**
 * User Profile & Reputation Page
 * /profile/[address]
 */

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  User,
  ShieldCheck,
  Award,
  Edit3,
  Check,
  Plus,
  Loader2,
  ExternalLink,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { ReputationSummary } from "@/components/ReputationSummary";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { formatAddress, formatMon } from "@/lib/utils";
import type { User as UserType, Task } from "@/types/task";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: rawAddress } = use(params);
  const profileAddress = rawAddress.toLowerCase();
  const { address: connectedAddress } = useAccount();

  const [user, setUser] = useState<UserType | null>(null);
  const [tasksRequested, setTasksRequested] = useState<Task[]>([]);
  const [tasksProvided, setTasksProvided] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"provided" | "requested">("provided");

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOwner =
    connectedAddress && connectedAddress.toLowerCase() === profileAddress;

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${profileAddress}`);
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
        setDisplayName(json.data.displayName || "");
        setSkills(json.data.skills || []);
        setIsAvailable(json.data.isAvailable || false);
        setTasksRequested(json.data.tasksRequested || []);
        setTasksProvided(json.data.tasksProvided || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [profileAddress]);

  async function handleSaveProfile() {
    try {
      setSaving(true);
      const res = await fetch(`/api/users/${profileAddress}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          skills,
          isAvailable,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
        setIsEditing(false);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function handleAddSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  }

  function handleRemoveSkill(s: string) {
    setSkills(skills.filter((item) => item !== s));
  }

  if (loading && !user) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
        <p className="text-sm">Loading user reputation profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Tasks</span>
      </Link>

      {/* Header Profile Card */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
              <User className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {user?.displayName || formatAddress(profileAddress)}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Human
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{profileAddress}</span>
                <a
                  href={`https://testnet.monadexplorer.com/address/${profileAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {isOwner && (
            <div>
              {isEditing ? (
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Editing Panel */}
        {isEditing && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Satoshi Builder"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Skills / Expertise
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g. React, Smart Contracts, UI Testing)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-white font-medium"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-white ml-1 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isAvailableCheckbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-800"
              />
              <label htmlFor="isAvailableCheckbox" className="text-slate-300">
                Mark as Available for Tasks (Shows in &apos;Available Now&apos; grid)
              </label>
            </div>
          </div>
        )}

        {/* Skills Display */}
        {!isEditing && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Skills & Expertise
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No skills listed yet</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* On-Chain Reputation Summary */}
      {user && <ReputationSummary user={user} />}

      {/* Task History Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("provided")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "provided"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Tasks Executed ({tasksProvided.length})
          </button>
          <button
            onClick={() => setActiveTab("requested")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "requested"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Tasks Requested ({tasksRequested.length})
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {(activeTab === "provided" ? tasksProvided : tasksRequested).length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              No tasks found in this category.
            </div>
          ) : (
            (activeTab === "provided" ? tasksProvided : tasksRequested).map(
              (taskItem) => (
                <Link
                  key={taskItem.id}
                  href={`/tasks/${taskItem.id}`}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-600/50 flex items-center justify-between gap-4 transition-all block group"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200 group-hover:text-purple-300 transition-colors">
                      {taskItem.title}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatMon(taskItem.rewardWei)} MON · {taskItem.category}
                    </div>
                  </div>

                  <TaskStatusBadge status={taskItem.status} />
                </Link>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
