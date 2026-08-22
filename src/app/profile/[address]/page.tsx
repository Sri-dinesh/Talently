/**
 * User Profile & Reputation Page — Claude Brand Theme
 * /profile/[address]
 */

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  User,
  ShieldCheck,
  Edit3,
  Check,
  Loader2,
  ExternalLink,
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
      <div className="py-20 text-center text-[#8A857B] dark:text-[#7D7970] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C15F3C] dark:text-[#D97757]" />
        <p className="text-sm">Loading user reputation profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-8">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A857B] dark:text-[#7D7970] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Tasks</span>
      </Link>

      {/* Header Profile Card */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C15F3C]/10 dark:bg-[#D97757]/15 flex items-center justify-center text-[#C15F3C] dark:text-[#D97757]">
              <User className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                  {user?.displayName || formatAddress(profileAddress)}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] text-xs font-medium border border-[#2E7D32]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Human
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8A857B] dark:text-[#7D7970] font-mono">
                <span>{profileAddress}</span>
                <a
                  href={`https://testnet.monadexplorer.com/address/${profileAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C15F3C] dark:text-[#D97757] hover:underline"
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
                  className="px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
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
                  className="px-3.5 py-2 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] hover:bg-[#ECEAE4] dark:hover:bg-[#2C2C29] text-[#1A1A18] dark:text-[#F4F3EE] text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#E8E6DF] dark:border-[#3A3A36]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#B1ADA1]" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Editing Panel */}
        {isEditing && (
          <div className="p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-4 text-xs">
            <div>
              <label className="block text-[#6B665E] dark:text-[#B1ADA1] font-semibold mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Satoshi Builder"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] focus:outline-none focus:border-[#C15F3C]"
              />
            </div>

            <div>
              <label className="block text-[#6B665E] dark:text-[#B1ADA1] font-semibold mb-1">
                Skills / Expertise
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g. React, Smart Contracts, UI Testing)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] focus:outline-none focus:border-[#C15F3C]"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] font-medium"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#6B665E] dark:text-[#B1ADA1]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-[#C15F3C] ml-1 font-bold"
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
                className="w-4 h-4 rounded accent-[#C15F3C]"
              />
              <label htmlFor="isAvailableCheckbox" className="text-[#1A1A18] dark:text-[#F4F3EE] font-medium">
                Mark as Available for Tasks (Shows in &apos;Available Now&apos; grid)
              </label>
            </div>
          </div>
        )}

        {/* Skills Display */}
        {!isEditing && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider block mb-2">
              Skills & Expertise
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#6B665E] dark:text-[#B1ADA1] text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8A857B] dark:text-[#7D7970]">No skills listed yet</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* On-Chain Reputation Summary */}
      {user && <ReputationSummary user={user} />}

      {/* Task History Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-[#E8E6DF] dark:border-[#2C2C29] gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("provided")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "provided"
                ? "border-[#C15F3C] text-[#C15F3C] dark:text-[#D97757] font-semibold"
                : "border-transparent text-[#8A857B] dark:text-[#7D7970] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE]"
            }`}
          >
            Tasks Executed ({tasksProvided.length})
          </button>
          <button
            onClick={() => setActiveTab("requested")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "requested"
                ? "border-[#C15F3C] text-[#C15F3C] dark:text-[#D97757] font-semibold"
                : "border-transparent text-[#8A857B] dark:text-[#7D7970] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE]"
            }`}
          >
            Tasks Requested ({tasksRequested.length})
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {(activeTab === "provided" ? tasksProvided : tasksRequested).length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-center text-xs text-[#8A857B] dark:text-[#7D7970]">
              No tasks found in this category.
            </div>
          ) : (
            (activeTab === "provided" ? tasksProvided : tasksRequested).map(
              (taskItem) => (
                <Link
                  key={taskItem.id}
                  href={`/tasks/${taskItem.id}`}
                  className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/40 dark:hover:border-[#D97757]/40 flex items-center justify-between gap-4 transition-all block group shadow-xs"
                >
                  <div>
                    <h3 className="font-medium text-sm text-[#1A1A18] dark:text-[#F4F3EE] group-hover:text-[#C15F3C] dark:group-hover:text-[#D97757] transition-colors">
                      {taskItem.title}
                    </h3>
                    <div className="text-xs text-[#8A857B] dark:text-[#7D7970] mt-1 font-mono">
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
