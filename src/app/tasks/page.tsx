/**
 * Open Tasks Explorer Page — Claude Brand Palette
 * Allows filtering by category, status, and search query with real-time updates and warm styling
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, Filter, RefreshCw, Layers } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { useTaskRealtime } from "@/hooks/useTaskRealtime";
import type { Task } from "@/types/task";

const CATEGORIES = [
  "All",
  "Testing",
  "Technical",
  "Design",
  "Knowledge",
  "Social",
  "Local",
];

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Open Only", value: "OPEN" },
  { label: "In Progress", value: "ACCEPTED" },
  { label: "Under Review", value: "SUBMITTED" },
  { label: "Paid Out / Completed", value: "APPROVED" },
];

export default function TasksPage() {
  const [initialTasks, setInitialTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Subscribe to live Realtime updates
  const realtimeTasks = useTaskRealtime(initialTasks);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.data) {
        setInitialTasks(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = realtimeTasks.filter((t) => {
    if (selectedCategory !== "All" && t.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchSkill = t.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSkill) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A18] dark:text-[#F4F3EE]">
            Explore Micro-Tasks
          </h1>
          <p className="text-xs sm:text-sm text-[#8A857B] dark:text-[#7D7970] mt-1 font-normal">
            Browse live human tasks on Monad Testnet and claim instant escrow payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            className="p-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-[#8A857B] dark:text-[#7D7970] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors"
            title="Refresh tasks list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-medium text-xs shadow-xs transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Task</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B1ADA1]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task title, description, or required skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] placeholder-[#8A857B] text-xs focus:outline-none focus:border-[#C15F3C] dark:focus:border-[#D97757] transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#3A3A36] text-[#1A1A18] dark:text-[#F4F3EE] text-xs focus:outline-none focus:border-[#C15F3C] dark:focus:border-[#D97757] transition-all cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#8A857B] dark:text-[#7D7970] text-[11px] font-medium mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#B1ADA1]" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#C15F3C] text-white shadow-xs"
                  : "bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] border border-[#E8E6DF] dark:border-[#3A3A36]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      {loading && filteredTasks.length === 0 ? (
        <div className="p-16 text-center text-[#8A857B] dark:text-[#7D7970] space-y-2">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#C15F3C] dark:text-[#D97757]" />
          <p className="text-xs">Loading open micro-tasks from Monad...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#F4F3EE] dark:bg-[#242422] flex items-center justify-center mx-auto text-[#B1ADA1]">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
            No matching tasks found
          </h3>
          <p className="text-xs text-[#8A857B] dark:text-[#7D7970] max-w-sm mx-auto">
            Try adjusting your search criteria, or post a new micro-task with instant escrow!
          </p>
          <div className="pt-2">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C15F3C] text-white text-xs font-medium hover:bg-[#A84F30] transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
