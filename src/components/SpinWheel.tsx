"use client";
/**
 * SpinWheel Component — Massive Full-Screen SVG Roulette Wheel
 * Physics-based deceleration easing, glowing top needle, audio/visual ticks, and skip animation support.
 */

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Trophy, Zap, Clock, Search, Users, Palette, Server } from "lucide-react";
import type { WheelSegment } from "@/types/roulette";

interface SpinWheelProps {
  segments: WheelSegment[];
  isSpinning: boolean;
  onSpin: (skipAnimation: boolean) => void;
  onSpinComplete: (winningSegment: WheelSegment) => void;
  winningSegmentId: number | null;
}

export function SpinWheel({
  segments,
  isSpinning,
  onSpin,
  onSpinComplete,
  winningSegmentId,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [needleTick, setNeedleTick] = useState(false);
  const wheelRef = useRef<SVGGElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const numSegments = segments.length || 8;
  const segmentAngle = 360 / numSegments; // 45 deg

  // Web Audio subtle click generator for needle ticking
  function playTickSound() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(460, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Trigger spin animation when winningSegmentId is provided
  useEffect(() => {
    if (winningSegmentId === null) return;

    const targetIndex = winningSegmentId;
    const extraRotations = skipAnimation ? 0 : 6 * 360; // 6 full revolutions

    const targetOffset = (numSegments - targetIndex) * segmentAngle - segmentAngle / 2;
    const finalRotation = rotation + extraRotations + ((targetOffset - (rotation % 360) + 360) % 360);

    setRotation(finalRotation);

    if (skipAnimation) {
      onSpinComplete(segments[targetIndex]);
      return;
    }

    // Ticking timer effect
    const tickInterval = setInterval(() => {
      setNeedleTick((prev) => !prev);
      playTickSound();
    }, 120);

    const timer = setTimeout(() => {
      clearInterval(tickInterval);
      onSpinComplete(segments[targetIndex]);
    }, 4500);

    return () => {
      clearTimeout(timer);
      clearInterval(tickInterval);
    };
  }, [winningSegmentId]);

  // Generate SVG path for a slice
  function getSlicePath(index: number): string {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
    const r = 188;
    const cx = 200;
    const cy = 200;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-2xl mx-auto select-none">
      {/* Relative container holding massive wheel and glowing pointer */}
      <div className="relative w-[min(92vw,62vh,560px)] h-[min(92vw,62vh,560px)] flex items-center justify-center my-auto transition-all duration-300">
        {/* Massive Ambient Radial Halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#C15F3C]/30 via-[#836EF9]/30 to-[#F59E0B]/30 blur-[80px] pointer-events-none" />

        {/* Top Pointer Needle (Fixed at 12 o'clock) */}
        <div
          className={`absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 z-30 transition-transform duration-75 ${
            needleTick ? "scale-110 -translate-y-1.5" : "scale-100"
          }`}
        >
          <div className="w-0 h-0 border-l-[18px] sm:border-l-[22px] border-l-transparent border-r-[18px] sm:border-r-[22px] border-r-transparent border-t-[32px] sm:border-t-[38px] border-t-[#F4F3EE] filter drop-shadow-[0_0_20px_#C15F3C]" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#C15F3C] ring-2 sm:ring-3 ring-[#F4F3EE] shadow-lg" />
        </div>

        {/* Outer Wheel Ring Housing */}
        <div className="relative w-full h-full rounded-full p-3 sm:p-4 bg-gradient-to-b from-[#2E2E2B] via-[#1A1A18] to-[#0F0F0E] shadow-[0_0_80px_rgba(0,0,0,0.95),inset_0_0_25px_rgba(255,255,255,0.08)] border-[5px] border-[#3E3E3A]">
          {/* Rotating SVG Wheel */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full rounded-full overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: skipAnimation ? "none" : "transform 4.5s cubic-bezier(0.12, 0.95, 0.22, 1)",
            }}
          >
            {/* Slices */}
            <g ref={wheelRef}>
              {segments.map((seg, idx) => {
                const midAngle = (idx * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
                const textR = 126;
                const iconR = 168;
                const tx = 200 + textR * Math.cos(midAngle);
                const ty = 200 + textR * Math.sin(midAngle);
                const ix = 200 + iconR * Math.cos(midAngle);
                const iy = 200 + iconR * Math.sin(midAngle);
                const rotDeg = idx * segmentAngle + segmentAngle / 2;

                const sliceBg = idx % 2 === 0 ? "#1C1C1A" : "#262623";

                return (
                  <g key={seg.id} className="cursor-pointer">
                    {/* Slice wedge */}
                    <path
                      d={getSlicePath(idx)}
                      fill={sliceBg}
                      stroke="#3E3E3A"
                      strokeWidth="2.5"
                    />

                    {/* Edge neon glow pearl */}
                    <circle
                      cx={ix}
                      cy={iy}
                      r="5.5"
                      fill={seg.color}
                      className="filter drop-shadow-[0_0_10px_currentColor]"
                    />

                    {/* Slice text and reward */}
                    <g transform={`translate(${tx}, ${ty}) rotate(${rotDeg + 90})`}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#F4F3EE"
                        fontSize="12.5"
                        fontWeight="800"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {seg.rewardMon} MON
                      </text>
                      <text
                        y="15"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={seg.accent || seg.color}
                        fontSize="9.5"
                        fontWeight="700"
                        letterSpacing="0.6"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {seg.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Inner Gold Border Ring */}
            <circle cx="200" cy="200" r="58" fill="none" stroke="#3E3E3A" strokeWidth="3.5" />
          </svg>

          {/* Central Core Orb / Spin Button */}
          <div className="absolute inset-0 m-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#FAF9F5] via-[#E8E6DF] to-[#9E9A8E] p-1.5 sm:p-2 shadow-[0_0_45px_rgba(255,255,255,0.4)] z-20 flex items-center justify-center">
            <button
              onClick={() => onSpin(skipAnimation)}
              disabled={isSpinning}
              type="button"
              className="w-full h-full rounded-full bg-gradient-to-tr from-[#141413] via-[#1E1E1C] to-[#2E2E2B] border-2 border-[#FAF9F5]/40 flex flex-col items-center justify-center text-center text-[#F4F3EE] hover:scale-105 active:scale-95 transition-transform disabled:opacity-80 disabled:cursor-not-allowed group shadow-2xl"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#C15F3C] group-hover:rotate-12 transition-transform filter drop-shadow-[0_0_8px_#C15F3C]" />
              <span className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-[#F4F3EE] mt-0.5">
                {isSpinning ? "SPINNING" : "SPIN"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls Area (Matching Reference Image) */}
      <div className="w-full max-w-md space-y-3 pt-2 pb-4 text-center">
        {/* Skip Animation Toggle */}
        <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-[#8A857B]">
          <span className="font-medium text-[#B1ADA1]">Skip animation</span>
          <button
            type="button"
            role="switch"
            aria-checked={skipAnimation}
            onClick={() => setSkipAnimation(!skipAnimation)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              skipAnimation ? "bg-[#C15F3C]" : "bg-[#2C2C29]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                skipAnimation ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Informative Subtitle */}
        <p className="text-xs text-[#8A857B] max-w-xs mx-auto">
          You have unlimited free demo spins today on Monad Testnet
        </p>

        {/* Glowing Full-Width Pill CTA */}
        <button
          onClick={() => onSpin(skipAnimation)}
          disabled={isSpinning}
          className="w-full py-4 sm:py-4.5 rounded-full bg-gradient-to-r from-[#836EF9] via-[#C15F3C] to-[#E07A5F] hover:opacity-95 active:scale-[0.985] text-white font-extrabold text-sm sm:text-base shadow-[0_0_35px_rgba(193,95,60,0.5)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isSpinning ? "Spinning Roulette..." : "Spin Wheel for Bounty ✨"}</span>
        </button>
      </div>
    </div>
  );
}