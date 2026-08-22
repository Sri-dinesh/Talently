// Human Swarm Explorer — /swarm
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw, Users, Sparkles } from "lucide-react";
import { SwarmTaskCard } from "@/components/SwarmTaskCard";
import type { SwarmTask } from "@/types/swarm";

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed / Paid Out", value: "COMPLETED" },
];

export default function SwarmPage() {
  const [tasks, setTasks] = useState<SwarmTask[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/swarm");
      const json = await res.json();
      if (json.data) {
        setTasks(json.data);
        const counts: Record<string, number> = {};
        await Promise.all(
          json.data.map(async (t: SwarmTask) => {
            try {
              const r = await fetch("/api/swarm/" + t.id);
              const j = await r.json();
              counts[t.id] = j.data?.submissions?.length || 0;
            } catch { counts[t.id] = 0; }
          })
        );
        setParticipantCounts(counts);
      }
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks.filter((t) => selectedStatus === "ALL" ? true : t.status === selectedStatus);

  return (
    <div className="space-y-8 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A18] dark:text-[#F4F3EE]">Human Swarm</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] border border-[#C15F3C]/20">New</span>
          </div>
          <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">N independent workers execute one task in parallel. AI clusters findings into consensus intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTasks} className="p-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-[#8A857B] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] transition-colors">
            <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          </button>
          <Link href="/swarm/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] text-white font-medium text-xs shadow-xs transition-all">
            <PlusCircle className="w-4 h-4" /><span>New Swarm Task</span>
          </Link>
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#C15F3C]/5 to-[#B1ADA1]/5 border border-[#C15F3C]/15 dark:border-[#D97757]/15">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {[{icon: PlusCircle, step: "01", label: "Post Swarm Task", desc: "Set reward per worker and max participants"},
            {icon: Users, step: "02", label: "Workers Execute", desc: "N independent humans test in parallel"},
            {icon: Sparkles, step: "03", label: "AI Consensus Report", desc: "Cluster engine finds unique findings and consensus"}
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#C15F3C]/10 text-[#C15F3C] flex items-center justify-center shrink-0"><item.icon className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] font-mono text-[#B1ADA1] mb-0.5">{item.step}</div>
                <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">{item.label}</div>
                <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setSelectedStatus(f.value)}
            className={"px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all " + (selectedStatus === f.value ? "bg-[#C15F3C] text-white border-[#C15F3C]" : "bg-[#FFFFFF] dark:bg-[#1E1E1C] text-[#8A857B] border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/50")}
          >{f.label}</button>
        ))}
      </div>
      {loading && filtered.length === 0 ? (
        <div className="py-20 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#C15F3C]" /><p className="text-sm text-[#8A857B]">Loading swarm tasks...</p></div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F4F3EE] dark:bg-[#242422] flex items-center justify-center mx-auto"><Users className="w-6 h-6 text-[#C15F3C]" /></div>
          <h3 className="text-base font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">No swarm tasks yet</h3>
          <p className="text-xs text-[#8A857B] max-w-sm mx-auto">Be the first to post a swarm task and harness crowd-sourced verification.</p>
          <Link href="/swarm/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] text-white text-xs font-medium"><PlusCircle className="w-4 h-4" />Create First Swarm Task</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((task) => <SwarmTaskCard key={task.id} task={task} participantCount={participantCounts[task.id] || 0} />)}
        </div>
      )}
    </div>
  );
}