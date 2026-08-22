"use client";
/**
 * TaskWinModal Component
 * Shows winning random task allocation with reward badge, details, and 1-click execution CTA
 */

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, Trophy, ArrowRight, Zap, Clock, Coins, CheckCircle2, RotateCcw, X, ShieldCheck } from "lucide-react";
import type { WheelSegment } from "@/types/roulette";
import type { Task } from "@/types/task";

interface TaskWinModalProps {
  segment: WheelSegment;
  task?: Task | any;
  actionUrl: string;
  onSpinAgain: () => void;
  onClose: () => void;
}

export function TaskWinModal({ segment, task, actionUrl, onSpinAgain, onClose }: TaskWinModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti Particle Burst
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#C15F3C", "#836EF9", "#F59E0B", "#2E7D32", "#EC4899", "#22D3EE", "#FFFFFF"];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 80,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
      });
    }

    let animationId: number;
    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.008;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }

      if (alive) {
        animationId = requestAnimationFrame(render);
      }
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A09]/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background Confetti Canvas */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10 w-full h-full" />

      {/* Modal Dialog */}
      <div className="relative z-20 w-full max-w-lg rounded-3xl bg-[#1A1A18] border border-[#C15F3C]/40 p-6 sm:p-8 shadow-2xl space-y-6 text-[#F4F3EE] overflow-hidden">
        {/* Glowing top radial */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: segment.color }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#242422] text-[#8A857B] hover:text-[#F4F3EE] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
            style={{
              backgroundColor: `${segment.color}20`,
              borderColor: `${segment.color}50`,
              color: segment.accent || segment.color,
            }}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Task Allocated: {segment.label}</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#F4F3EE]">
            You Won a Bounty Slot!
          </h2>
          <p className="text-xs text-[#B1ADA1]">
            Escrow reward locked on Monad Testnet. Claim this task to start immediate execution.
          </p>
        </div>

        {/* Task Summary Card */}
        <div className="p-5 rounded-2xl bg-[#242422] border border-[#3A3A36] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-[#1A1A18] text-[10px] font-semibold text-[#B1ADA1] border border-[#3A3A36]">
                {segment.category}
              </span>
              <h3 className="text-sm font-semibold text-[#F4F3EE] leading-snug line-clamp-2">
                {task?.title || segment.sampleTitle}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#B1ADA1] uppercase block font-medium">Bounty Reward</span>
              <span className="text-lg font-bold text-[#C15F3C] font-mono block">
                {segment.rewardMon} MON
              </span>
            </div>
          </div>

          <p className="text-xs text-[#8A857B] leading-relaxed line-clamp-2">
            {task?.description || segment.sampleDescription}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-[#3A3A36] text-[11px] text-[#B1ADA1]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C15F3C]" />
              ~{segment.estimatedMinutes} min estimated
            </span>
            <span className="flex items-center gap-1 text-[#2E7D32] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Escrow
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href={actionUrl}
            className="w-full py-4 rounded-xl bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <span>Accept Task & Open Escrow ({segment.rewardMon} MON)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onSpinAgain}
            type="button"
            className="w-full py-3 rounded-xl bg-[#242422] hover:bg-[#2C2C29] border border-[#3A3A36] text-xs font-semibold text-[#B1ADA1] hover:text-[#F4F3EE] flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Spin Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
