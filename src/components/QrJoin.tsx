/**
 * QrJoin Component
 * Mobile-first QR code display and quick scanner component
 */

"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Copy, Check, ExternalLink } from "lucide-react";
import type { Task } from "@/types/task";
import { formatMon } from "@/lib/utils";

export function QrJoin({ task }: { task: Task }) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(`${window.location.origin}/join/${task.id}`);
    }
  }, [task.id]);

  function handleCopy() {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-900/40 text-center space-y-6 max-w-sm mx-auto shadow-2xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Phone Fast Join</span>
        </div>
        <h3 className="text-base font-bold text-white">Scan to Test on Phone</h3>
        <p className="text-xs text-slate-400">
          Earn <span className="text-purple-300 font-bold">{formatMon(task.rewardWei)} MON</span> by completing this task
        </p>
      </div>

      <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
        {currentUrl ? (
          <QRCodeSVG
            value={currentUrl}
            size={180}
            level="H"
            includeMargin={false}
            fgColor="#090d1f"
          />
        ) : (
          <div className="w-[180px] h-[180px] bg-slate-200 animate-pulse rounded-xl" />
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={handleCopy}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Join Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
