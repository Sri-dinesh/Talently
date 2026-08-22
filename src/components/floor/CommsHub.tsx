"use client";

import React, { useState } from "react";
import { 
  Radio, 
  Send, 
  Sparkles, 
  AlertOctagon, 
  Ghost, 
  HelpCircle, 
  MessageSquare, 
  Flame, 
  CheckCircle2,
  Lock
} from "lucide-react";
import { FloorMessage, FloorPlayer, FloorTileType } from "@/types/floor";

interface CommsHubProps {
  messages: FloorMessage[];
  myPlayer?: FloorPlayer;
  onSendClaim: (tileId: string, claimedType: FloorTileType, text?: string) => void;
  onSendGhostBroadcast: (text: string) => void;
  disabled?: boolean;
}

export function CommsHub({
  messages,
  myPlayer,
  onSendClaim,
  onSendGhostBroadcast,
  disabled,
}: CommsHubProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "CLAIMS" | "WHISPERS" | "GHOSTS">("ALL");
  const [customTileId, setCustomTileId] = useState("C3");
  const [customType, setCustomType] = useState<FloorTileType>("SAFE");
  const [customComment, setCustomComment] = useState("");
  const [ghostText, setGhostText] = useState("");

  const filteredMessages = messages.filter((m) => {
    if (activeTab === "CLAIMS") return m.type === "CLAIM" || m.type === "BETRAYAL";
    if (activeTab === "WHISPERS") {
      return (
        m.type === "WHISPER" &&
        (m.senderId === myPlayer?.id || m.targetPlayerId === myPlayer?.id)
      );
    }
    if (activeTab === "GHOSTS") return m.type === "GHOST";
    return true; // ALL
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTileId) return;
    onSendClaim(customTileId.toUpperCase(), customType, customComment || undefined);
    setCustomComment("");
  };

  const handleGhostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghostText.trim()) return;
    onSendGhostBroadcast(ghostText);
    setGhostText("");
  };

  return (
    <div className="bg-[#121211] border border-[#2C2C29] rounded-2xl p-4 flex flex-col gap-3 shadow-lg h-[480px]">
      {/* Top Header & Channel Tabs */}
      <div className="flex flex-col gap-2 border-b border-[#2C2C29] pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wider">
                Live Swarm Comms
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#8A857B]">
            {messages.length} Events Logged
          </span>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-xl border border-[#242422]">
          {(["ALL", "CLAIMS", "WHISPERS", "GHOSTS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all
                ${activeTab === tab ? "bg-[#1E1E1C] text-[#F4F3EE] border border-[#3A3A36]" : "text-[#8A857B] hover:text-[#B1ADA1]"}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed Container */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8A857B] text-xs">
            No transmissions in this frequency yet.
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isBetrayal = msg.type === "BETRAYAL";
            const isGhost = msg.type === "GHOST";
            const isClaim = msg.type === "CLAIM";
            const isSystem = msg.type === "SYSTEM";
            const isWhisper = msg.type === "WHISPER";

            return (
              <div
                key={`${msg.id}_${idx}`}
                className={`p-2.5 rounded-xl border flex flex-col gap-1 text-xs font-mono transition-all
                  ${isBetrayal ? "bg-[#EF4444]/10 border-[#EF4444]/40 text-[#FCA5A5]" : ""}
                  ${isGhost ? "bg-[#94A3B8]/10 border-[#94A3B8]/30 text-[#E2E8F0] italic" : ""}
                  ${isClaim ? "bg-[#836EF9]/10 border-[#836EF9]/30 text-[#DDD6FE]" : ""}
                  ${isSystem ? "bg-[#1A1A18] border-[#2C2C29] text-[#B1ADA1]" : ""}
                  ${isWhisper ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#FDE68A]" : ""}
                  ${!isBetrayal && !isGhost && !isClaim && !isSystem && !isWhisper ? "bg-[#161615] border-[#242422] text-[#F4F3EE]" : ""}
                `}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isBetrayal && <AlertOctagon className="w-3 h-3 text-[#EF4444]" />}
                    {isGhost && <Ghost className="w-3 h-3 text-[#94A3B8]" />}
                    {isClaim && <Sparkles className="w-3 h-3 text-[#836EF9]" />}
                    {isWhisper && <Lock className="w-3 h-3 text-[#F59E0B]" />}
                    <span style={{ color: msg.senderColor || undefined }}>
                      {msg.senderName}
                    </span>
                    {msg.targetPlayerName && (
                      <span className="text-[#8A857B]">
                        → {msg.targetPlayerName}
                      </span>
                    )}
                  </div>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                </div>
                <p className="text-[11px] leading-relaxed break-words">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input Console: Living Player Claims vs Ghost Transmissions */}
      {myPlayer?.isAlive ? (
        <form onSubmit={handleBroadcast} className="flex flex-col gap-2 pt-2 border-t border-[#2C2C29]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8A857B] uppercase">Broadcast Claim:</span>
            <select
              value={customTileId}
              onChange={(e) => setCustomTileId(e.target.value)}
              className="bg-[#0A0A0A] border border-[#2C2C29] rounded-lg px-2 py-1 text-xs text-[#F4F3EE] font-mono outline-none"
            >
              {Array.from({ length: 5 }).flatMap((_, y) =>
                Array.from({ length: 5 }).map((__, x) => {
                  const id = `${String.fromCharCode(65 + x)}${y + 1}`;
                  return <option key={id} value={id}>{id}</option>;
                })
              )}
            </select>
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value as FloorTileType)}
              className="bg-[#0A0A0A] border border-[#2C2C29] rounded-lg px-2 py-1 text-xs text-[#F4F3EE] font-mono outline-none"
            >
              <option value="SAFE">SAFE (✓)</option>
              <option value="TRAP">TRAP (💀)</option>
              <option value="TREASURE">TREASURE (💰)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              placeholder="Optional comment / bluff details..."
              className="flex-1 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl px-3 py-1.5 text-xs text-[#F4F3EE] outline-none focus:border-[#C15F3C]"
            />
            <button
              type="submit"
              disabled={disabled}
              className="px-3 py-1.5 bg-[#C15F3C] hover:bg-[#D97757] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3 h-3" />
              Claim
            </button>
          </div>
        </form>
      ) : myPlayer?.isGhost && !myPlayer.ghostMessageUsed ? (
        <form onSubmit={handleGhostSubmit} className="flex flex-col gap-2 pt-2 border-t border-[#2C2C29] bg-[#94A3B8]/5 p-2 rounded-xl border border-[#94A3B8]/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#94A3B8]">
            <span className="flex items-center gap-1">
              <Ghost className="w-3.5 h-3.5" /> GHOST TRANSMISSION (1-Time Use)
            </span>
            <span className="text-[#8A857B]">Send anonymous message to all survivors</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={ghostText}
              onChange={(e) => setGhostText(e.target.value)}
              placeholder="e.g. 'Don't trust Meena, she lured me into B3!'"
              required
              className="flex-1 bg-[#0A0A0A] border border-[#2C2C29] rounded-xl px-3 py-1.5 text-xs text-[#F4F3EE] outline-none focus:border-[#94A3B8]"
            />
            <button
              type="submit"
              disabled={disabled}
              className="px-3 py-1.5 bg-[#94A3B8] hover:bg-white text-[#0A0A0A] font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Ghost className="w-3 h-3" />
              Haunt
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
