"use client";
/**
 * Task Roulette Page — /spin
 * 100% Edge-to-Edge Full Screen Immersive Roulette on Monad
 */

import React, { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { X, Sparkles } from "lucide-react";
import { SpinWheel } from "@/components/SpinWheel";
import { TaskWinModal } from "@/components/TaskWinModal";
import { WHEEL_SEGMENTS, type WheelSegment } from "@/types/roulette";
import type { Task } from "@/types/task";

export default function SpinPage() {
  const { address } = useAccount();
  const [segments] = useState<WheelSegment[]>(WHEEL_SEGMENTS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetSegmentId, setTargetSegmentId] = useState<number | null>(null);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);
  const [winningTask, setWinningTask] = useState<Task | null>(null);
  const [actionUrl, setActionUrl] = useState<string>("/tasks");
  const [showWinModal, setShowWinModal] = useState(false);

  // Trigger spin
  async function handleSpin(skipAnimation: boolean) {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowWinModal(false);

    try {
      const randomSegmentId = Math.floor(Math.random() * segments.length);
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: randomSegmentId,
          workerAddress: address,
        }),
      });

      const json = await res.json();
      const seg = json.data?.segment || segments[randomSegmentId];
      setWinningSegment(seg);
      setWinningTask(json.data?.task || null);
      setActionUrl(json.data?.actionUrl || `/tasks`);

      setTargetSegmentId(seg.id);
    } catch (err) {
      console.error("Spin error:", err);
      const fallbackId = Math.floor(Math.random() * segments.length);
      setWinningSegment(segments[fallbackId]);
      setTargetSegmentId(fallbackId);
    }
  }

  function handleSpinComplete(seg: WheelSegment) {
    setIsSpinning(false);
    setWinningSegment(seg);
    setShowWinModal(true);
  }

  function handleSpinAgain() {
    setShowWinModal(false);
    setTargetSegmentId(null);
    handleSpin(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0C0B] flex flex-col justify-between items-center px-4 py-4 sm:py-6 overflow-hidden select-none">
      {/* Top Header Bar (Matching reference UI) */}
      <div className="w-full max-w-xl flex items-center justify-between z-10 shrink-0">
        <Link
          href="/tasks"
          className="p-2.5 rounded-full bg-[#1C1C1A] border border-[#2E2E2B] text-[#8A857B] hover:text-[#F4F3EE] hover:bg-[#282825] transition-colors shadow-sm"
          title="Exit to Tasks"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
        <span className="text-xs sm:text-sm font-black text-[#836EF9] uppercase tracking-widest flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(131,110,249,0.5)]">
          <Sparkles className="w-4 h-4" />
          Free spin every day
        </span>
        <div className="w-10 sm:w-11" /> {/* balance spacer */}
      </div>

      {/* Main Title Header */}
      <div className="text-center space-y-1 my-1 z-10 shrink-0">
        <h1 className="text-xl sm:text-3xl font-black text-[#F4F3EE] tracking-tight drop-shadow-sm">
          Random Task Allocation
        </h1>
        <p className="text-xs sm:text-sm text-[#8A857B] font-medium">
          Spin to get randomly matched with live Monad escrow bounties
        </p>
      </div>

      {/* Massive Center Spinning Wheel Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center relative z-10">
        <SpinWheel
          segments={segments}
          isSpinning={isSpinning}
          onSpin={handleSpin}
          onSpinComplete={handleSpinComplete}
          winningSegmentId={targetSegmentId}
        />
      </div>

      {/* Win Modal Popup */}
      {showWinModal && winningSegment && (
        <TaskWinModal
          segment={winningSegment}
          task={winningTask}
          actionUrl={actionUrl}
          onSpinAgain={handleSpinAgain}
          onClose={() => setShowWinModal(false)}
        />
      )}
    </div>
  );
}