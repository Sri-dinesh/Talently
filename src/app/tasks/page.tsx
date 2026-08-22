/**
 * Open Tasks Explorer Page
 * /tasks
 * Allows filtering by category, status, and search query with Realtime updates
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, Filter, RefreshCw, Cpu } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { useTaskRealtime } from "@/hooks/useTaskRealtime";
import type { Task, TaskStatus } from "@/types/task";

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
  { label: "Completed", value: "APPROVED" },
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
    // Category filter
    if (selectedCategory !== "All" && t.category !== selectedCategory) {
      return false;
    }
    // Status filter
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) {
      return false;
    }
    // Search query
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Explore Micro-Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse live human tasks on Monad Testnet and claim instant escrow rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh tasks list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Task</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status Dropdown */}
          <div className="sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      {loading && filteredTasks.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400" />
          <p className="text-xs">Loading open micro-tasks from Monad...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">
            No matching tasks found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, or post a new micro-task with instant escrow!
          </p>
          <div className="pt-2">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
            >
              <PlusCircle className="w-4 h-4" />
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
