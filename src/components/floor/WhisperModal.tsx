"use client";

import React, { useState } from "react";
import { X, MessageSquare, Send, Lock, User } from "lucide-react";
import { FloorPlayer } from "@/types/floor";

interface WhisperModalProps {
  targetPlayer?: FloorPlayer;
  isOpen: boolean;
  onClose: () => void;
  onSendWhisper: (targetPlayerId: string, text: string) => void;
  disabled?: boolean;
}

export function WhisperModal({
  targetPlayer,
  isOpen,
  onClose,
  onSendWhisper,
  disabled,
}: WhisperModalProps) {
  const [text, setText] = useState("");

  if (!isOpen || !targetPlayer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendWhisper(targetPlayer.id, text.trim());
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121211] border-2 border-[#836EF9]/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(131,110,249,0.2)] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2C2C29] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#836EF9]/20 border border-[#836EF9]/40 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#836EF9]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F3EE] uppercase tracking-wide">
                Secret Encrypted Whisper
              </h3>
              <p className="text-[11px] text-[#8A857B]">
                Only {targetPlayer.displayName} will receive this transmission.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1E1E1C] text-[#8A857B] hover:text-white flex items-center justify-center border border-[#2C2C29] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Info */}
        <div className="bg-[#181816] p-3 rounded-xl border border-[#2C2C29] flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ backgroundColor: targetPlayer.avatarColor }}
          >
            {targetPlayer.displayName.slice(0, 1)}
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8A857B]">Recipient</span>
            <p className="text-xs font-bold text-[#F4F3EE]">
              {targetPlayer.displayName} ({targetPlayer.trustScore}% Trust)
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#8A857B] uppercase">Secret Message / Alliance Offer</label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 'I know C3 is a trap, step onto D3 instead and we split the treasure...'"
              required
              className="bg-[#0A0A0A] border border-[#2C2C29] rounded-xl p-3 text-sm text-[#F4F3EE] outline-none focus:border-[#836EF9] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="w-full py-3 rounded-xl bg-[#836EF9] hover:bg-[#9986FA] text-white font-bold text-xs tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(131,110,249,0.3)] flex items-center justify-center gap-2 mt-2"
          >
            <Send className="w-4 h-4" />
            Send Encrypted Whisper
          </button>
        </form>
      </div>
    </div>
  );
}
