/**
 * Home Page — Human API
 * Features hero, quick actions, Available Now grid, and live open tasks stream
 */

import Link from "next/link";
import { Zap, ArrowRight, ShieldCheck, Cpu, Smartphone, Sparkles, Search } from "lucide-react";
import { AvailableNowGrid } from "@/components/AvailableNowGrid";
import { db } from "@/lib/db";
import { TaskCard } from "@/components/TaskCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialTasks: any[] = [];
  try {
    initialTasks = await db.getTasks({ status: "OPEN", limit: 6 });
  } catch {
    // Graceful fallback
  }

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-purple-950/30 via-slate-900/40 to-[#070913] border border-purple-900/30 p-8 sm:p-14 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Monad Blitz Hyderabad V3 · Real-Time Escrow</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Software has APIs for machines. <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
              Human API is an API for humans.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Lock MON rewards in verified smart contract escrow. Real humans instantly execute testing, reviews, and micro-tasks with live WebSocket updates and on-chain reputation.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/tasks/new"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Post a Micro-Task</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/tasks"
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center gap-2 transition-all"
            >
              <Search className="w-4 h-4 text-purple-400" />
              <span>Explore Open Tasks</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 mt-10 border-t border-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Trustless Escrow</div>
              <div className="text-[11px] text-slate-400">Funds locked until approval</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Sub-Second Realtime</div>
              <div className="text-[11px] text-slate-400">Supabase CDC WebSocket push</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Mobile QR Join</div>
              <div className="text-[11px] text-slate-400">Instant test execution on phone</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Now Online Grid */}
      <AvailableNowGrid />

      {/* Live Open Tasks Stream */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Open Tasks Stream</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Live
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Claim an open task, submit your results, and receive instant MON payouts.
            </p>
          </div>

          <Link
            href="/tasks"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {initialTasks.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">
              No open tasks at the moment
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to post a micro-task on Monad Testnet and test the live escrow workflow!
            </p>
            <div className="pt-2">
              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
              >
                <span>Create First Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {initialTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* How it Works Section */}
      <div className="rounded-3xl bg-slate-950/60 border border-slate-800/80 p-8 sm:p-12">
        <h2 className="text-lg font-bold text-center text-white mb-2">
          How Human API Works
        </h2>
        <p className="text-xs text-slate-400 text-center max-w-md mx-auto mb-10">
          A seamless 3-step loop backed by smart contract escrow on Monad.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Post & Lock Escrow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe your task (e.g. app testing) and deposit MON into the smart contract. Funds are locked safely.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Human Accepts & Submits</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A verified human accepts the task via browser or mobile QR scan, performs the work, and logs the result on-chain.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Approve & Release MON</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Requester inspects the result and approves payment. Contract instantly transfers MON and increments on-chain reputation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
