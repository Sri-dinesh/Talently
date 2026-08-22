/**
 * Home Page — Human API ($10,000 Luxury Editorial Redesign)
 * Features interactive Hero capability simulator, real-time Monad pulse, and Apple-grade precision.
 */

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Smartphone, Sparkles, PlusCircle, Compass, CheckCircle2, Lock, ArrowUpRight, Award } from "lucide-react";
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
    <div className="space-y-20 py-2">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Interactive Capability Playground & Live Monad Telemetry */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-8 sm:p-14 lg:p-16 overflow-hidden shadow-sm">
        {/* Subtle Atmospheric Mesh Glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[32rem] h-[32rem] bg-[#C15F3C]/5 dark:bg-[#D97757]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[32rem] h-[32rem] bg-[#B1ADA1]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
          {/* Left Column: Editorial Manifesto & CTAs */}
          <div className="lg:col-span-7 space-y-7">
            {/* Live Telemetry Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-xs font-medium text-[#1A1A18] dark:text-[#F4F3EE]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] dark:bg-[#4CAF50] radar-live" />
              <span className="font-semibold text-[#C15F3C] dark:text-[#D97757]">Monad Testnet</span>
              <span className="text-[#8A857B] dark:text-[#7D7970]">·</span>
              <span className="text-[#5C5851] dark:text-[#B1ADA1]">Sub-Second Escrow Finality</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#1A1A18] dark:text-[#F4F3EE] leading-[1.12]">
              Software has APIs for machines. <br />
              <span className="editorial-serif text-[#C15F3C] dark:text-[#D97757] font-normal">
                Human API
              </span>{" "}
              is the API for humans.
            </h1>

            <p className="text-base sm:text-lg text-[#5C5851] dark:text-[#B1ADA1] leading-relaxed max-w-xl font-normal">
              Autonomous AI agents and protocols programmatically lock MON in escrow. Real humans instantly execute testing, reviews, and physical verifications with live on-chain reputation.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/tasks/new"
                className="luxury-btn-primary inline-flex items-center gap-2.5 text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post a Micro-Task</span>
                <ArrowRight className="w-4 h-4 opacity-80" />
              </Link>

              <Link
                href="/tasks"
                className="luxury-btn-secondary inline-flex items-center gap-2 text-sm font-medium"
              >
                <Compass className="w-4 h-4 text-[#C15F3C] dark:text-[#D97757]" />
                <span>Explore Open Tasks</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Interactive Architecture Widget */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 space-y-4 shadow-sm relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF] dark:border-[#2C2C29]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C15F3C]" />
                  <span className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                    Protocol Architecture
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#8A857B] dark:text-[#7D7970]">
                  Chain ID 10143
                </span>
              </div>

              {/* Protocol Flow Animation Simulation */}
              <div className="space-y-3 text-xs">
                {/* Step 1: Lock */}
                <div className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] flex items-center justify-center font-bold text-[10px]">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-[#1A1A18] dark:text-[#F4F3EE]">Lock Escrow Vault</div>
                      <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">createTask(0.05 MON)</div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-[#C15F3C]" />
                </div>

                {/* Step 2: Human Claim */}
                <div className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#B1ADA1]/20 text-[#5C5851] dark:text-[#B1ADA1] flex items-center justify-center font-bold text-[10px]">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-[#1A1A18] dark:text-[#F4F3EE]">Human Fast-Claim</div>
                      <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">Mobile QR Scan & Execution</div>
                    </div>
                  </div>
                  <Smartphone className="w-4 h-4 text-[#B1ADA1]" />
                </div>

                {/* Step 3: Payout */}
                <div className="p-3 rounded-xl bg-[#2E7D32]/5 border border-[#2E7D32]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#2E7D32]/15 text-[#2E7D32] dark:text-[#4CAF50] flex items-center justify-center font-bold text-[10px]">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-[#2E7D32] dark:text-[#4CAF50]">Instant MON Payout</div>
                      <div className="text-[11px] text-[#2E7D32]/80">approveTask() → Transferred</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-[#4CAF50]" />
                </div>
              </div>

              {/* Protocol Spec Footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#8A857B] dark:text-[#7D7970]">
                <span>0% Protocol Fee</span>
                <span className="font-medium text-[#2E7D32] dark:text-[#4CAF50]">Verified Trustless</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 mt-12 border-t border-[#E8E6DF] dark:border-[#2C2C29]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 dark:bg-[#D97757]/15 flex items-center justify-center text-[#C15F3C] dark:text-[#D97757] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Trustless Escrow</div>
              <div className="text-[12px] text-[#8A857B] dark:text-[#7D7970]">Funds held in contract until approval</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 dark:bg-[#4CAF50]/15 flex items-center justify-center text-[#2E7D32] dark:text-[#4CAF50] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Sub-Second Finality</div>
              <div className="text-[12px] text-[#8A857B] dark:text-[#7D7970]">Real-time Monad state machine</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#B1ADA1]/20 flex items-center justify-center text-[#5C5851] dark:text-[#B1ADA1] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Mobile QR Fast Join</div>
              <div className="text-[12px] text-[#8A857B] dark:text-[#7D7970]">Instant test execution on phone</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. AVAILABLE NOW GRID: Live Talent Radar */}
      {/* ========================================================================= */}
      <AvailableNowGrid />

      {/* ========================================================================= */}
      {/* 3. LIVE OPEN TASKS STREAM */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE] flex items-center gap-2.5">
              <span>Open Tasks Stream</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/20">
                Live on Monad
              </span>
            </h2>
            <p className="text-xs text-[#8A857B] dark:text-[#7D7970] mt-1">
              Claim an open task, submit your verified findings, and receive instant MON payouts.
            </p>
          </div>

          <Link
            href="/tasks"
            className="text-xs font-medium text-[#C15F3C] dark:text-[#D97757] hover:underline flex items-center gap-1"
          >
            <span>View All Tasks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {initialTasks.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F3EE] dark:bg-[#242422] flex items-center justify-center mx-auto text-[#B1ADA1]">
              <Sparkles className="w-6 h-6 text-[#C15F3C]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
                No open tasks at the moment
              </h3>
              <p className="text-xs text-[#8A857B] dark:text-[#7D7970] max-w-sm mx-auto">
                Be the first to post a micro-task on Monad Testnet and test the live escrow workflow!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/tasks/new"
                className="luxury-btn-primary inline-flex items-center gap-2 text-xs font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Task</span>
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
      </section>

      {/* ========================================================================= */}
      {/* 4. PROTOCOL ARCHITECTURE & TRUST GUARANTEES */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-lg mx-auto mb-10 space-y-1.5">
          <h2 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
            How Human API Works
          </h2>
          <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
            A trustless 3-step escrow loop verified on Monad smart contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] font-semibold text-xs flex items-center justify-center">
              01
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Post & Lock Escrow</h3>
            <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] leading-relaxed">
              Define your task requirements and lock MON into the escrow contract. Zero protocol fees, 100% refund on cancellation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-[#B1ADA1]/20 text-[#5C5851] dark:text-[#B1ADA1] font-semibold text-xs flex items-center justify-center">
              02
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Human Claim & Submit</h3>
            <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] leading-relaxed">
              A verified human accepts via desktop or mobile QR fast-join, performs the testing, and registers the proof checkpoint.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] font-semibold text-xs flex items-center justify-center">
              03
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Approve & Payout</h3>
            <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] leading-relaxed">
              Requester inspects the findings and approves. Contract instantly releases the MON reward directly to the worker&apos;s wallet.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
