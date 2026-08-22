"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { 
  Play, 
  PlusCircle, 
  KeyRound, 
  Users, 
  Flame, 
  ShieldAlert, 
  Coins, 
  Eye, 
  Ghost, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw
} from "lucide-react";

interface GameSummary {
  id: string;
  title: string;
  status: string;
  round: number;
  maxRounds: number;
  maxPlayers: number;
  activePlayersCount: number;
  totalPlayersCount: number;
  bountyMon: string;
  isPrivate: boolean;
  roomCode?: string;
  creatorAddress: string;
  winnerName?: string;
  createdAt: string;
}

export default function FloorLobbyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchGames = async () => {
    try {
      const res = await fetch("/api/floor/games");
      const json = await res.json();
      if (json.data) {
        setGames(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch games:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickPlay = async () => {
    if (!isConnected || !address) {
      alert("Please connect your Monad wallet to enter the arena.");
      return;
    }

    setCreating(true);
    try {
      // Find an open in-progress game or create a fresh one
      const openGame = games.find((g) => g.status === "IN_PROGRESS" && !g.isPrivate);
      if (openGame) {
        router.push(`/floor/${openGame.id}`);
        return;
      }

      // Create new game
      const res = await fetch("/api/floor/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAddress: address,
          title: "Monad High-Stakes Grid",
          isPrivate: false,
        }),
      });
      const json = await res.json();
      if (json.data) {
        router.push(`/floor/${json.data.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start match");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert("Please connect your Monad wallet.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/floor/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAddress: address,
          title: customTitle || "Private Tactical Arena",
          isPrivate,
        }),
      });
      const json = await res.json();
      if (json.data) {
        router.push(`/floor/${json.data.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    const target = games.find((g) => g.roomCode?.toUpperCase() === roomCodeInput.trim().toUpperCase());
    if (target) {
      router.push(`/floor/${target.id}`);
    } else {
      alert("Room Code not found. Please verify the code.");
    }
  };

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#121211] border border-[#2C2C29] p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C15F3C]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#C15F3C]/20 text-[#C15F3C] border border-[#C15F3C]/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Multiplayer Social Deduction & Grid Survival
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#836EF9]/10 text-[#836EF9] border border-[#836EF9]/30 text-xs font-mono font-bold">
              5-Min Rounds · 0.25 MON Bounty
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#F4F3EE] uppercase leading-tight font-serif">
            The Floor Is <span className="text-[#C15F3C]">Lying</span>
          </h1>

          <p className="text-base text-[#B1ADA1] leading-relaxed">
            A real-time survival game on a hidden 5×5 hazard matrix. 
            <strong className="text-[#F4F3EE]"> Nobody has complete information.</strong> You receive partial sensor scans, but some hints are system deceptions. Decide who to trust, when to broadcast truth, when to bluff, and when to call upon <strong className="text-[#C15F3C]">Human API</strong> to survive.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={handleQuickPlay}
              disabled={creating}
              className="py-4 px-8 rounded-2xl bg-[#C15F3C] hover:bg-[#D97757] text-white font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(193,95,60,0.4)] flex items-center gap-3 group"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isConnected ? "Quick Play (Instant Match)" : "Connect & Play"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="py-4 px-6 rounded-2xl bg-[#1E1E1C] hover:bg-[#2C2C29] text-[#F4F3EE] font-bold text-sm tracking-wider uppercase border border-[#2C2C29] transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5 text-[#836EF9]" />
              <span>Create Custom Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Key Pillars of the Game */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#836EF9]/20 border border-[#836EF9]/40 flex items-center justify-center">
            <Eye className="w-5 h-5 text-[#836EF9]" />
          </div>
          <h3 className="text-base font-bold text-[#F4F3EE]">Asymmetric Information</h3>
          <p className="text-xs text-[#8A857B] leading-relaxed">
            Each player receives a confidential dossier containing 4-5 private tile scans. 15% of hints are glitched noise. Build consensus or manipulate rivals.
          </p>
        </div>

        <div className="p-6 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/20 border border-[#C15F3C]/40 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#C15F3C]" />
          </div>
          <h3 className="text-base font-bold text-[#F4F3EE]">Live Trust & Betrayal</h3>
          <p className="text-xs text-[#8A857B] leading-relaxed">
            Your Trust Score increases when your intel proves true, and plummets on lethal deceptions. Build trust early to lure players into late-game traps.
          </p>
        </div>

        <div className="p-6 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center">
            <Ghost className="w-5 h-5 text-[#10B981]" />
          </div>
          <h3 className="text-base font-bold text-[#F4F3EE]">Graveyard & Ghost Haunts</h3>
          <p className="text-xs text-[#8A857B] leading-relaxed">
            Eliminated players become Ghosts with 1 anonymous psychic broadcast to manipulate the remaining survivors from beyond the grave.
          </p>
        </div>
      </div>

      {/* Active Matches & Room Finder */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C2C29] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#F4F3EE] uppercase tracking-wider">
              Active Survival Arenas
            </h2>
            <p className="text-xs text-[#8A857B]">
              Jump into an ongoing match or spectate live swarm strategies.
            </p>
          </div>

          {/* Join by Code Form */}
          <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#8A857B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Room Code..."
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                className="bg-[#121211] border border-[#2C2C29] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F4F3EE] font-mono uppercase placeholder:normal-case outline-none focus:border-[#C15F3C] w-48"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-[#1E1E1C] hover:bg-[#2C2C29] text-white font-bold text-xs border border-[#2C2C29] transition-all"
            >
              Join
            </button>
            <button
              type="button"
              onClick={fetchGames}
              className="p-2 rounded-xl bg-[#121211] border border-[#2C2C29] text-[#8A857B] hover:text-white transition-all"
              title="Refresh Arenas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Arenas Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#8A857B]">
            <Loader2 className="w-8 h-8 animate-spin text-[#C15F3C]" />
            <span className="text-xs font-mono">Scanning live Monad arenas...</span>
          </div>
        ) : games.length === 0 ? (
          <div className="py-16 bg-[#121211] border border-[#2C2C29] rounded-2xl flex flex-col items-center justify-center gap-4 text-center p-6">
            <ShieldAlert className="w-10 h-10 text-[#8A857B]" />
            <div>
              <h3 className="text-sm font-bold text-[#F4F3EE]">No Active Arenas Found</h3>
              <p className="text-xs text-[#8A857B] mt-1">
                Be the pioneer to deploy a 5×5 survival grid on Monad Testnet!
              </p>
            </div>
            <button
              onClick={handleQuickPlay}
              className="py-2.5 px-5 rounded-xl bg-[#C15F3C] text-white font-bold text-xs uppercase"
            >
              Launch Match Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g) => (
              <div
                key={g.id}
                className="bg-[#121211] border border-[#2C2C29] hover:border-[#3A3A36] rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-md group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      {g.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#EAB308] flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {g.bountyMon}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F4F3EE] group-hover:text-[#C15F3C] transition-colors">
                    {g.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs font-mono text-[#8A857B]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {g.activePlayersCount}/{g.maxPlayers} Alive
                    </span>
                    <span>·</span>
                    <span>Round {g.round}/{g.maxRounds}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#242422]">
                  {g.roomCode ? (
                    <span className="text-[10px] font-mono text-[#836EF9] bg-[#836EF9]/10 px-2 py-0.5 rounded border border-[#836EF9]/20">
                      Code: {g.roomCode}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#8A857B]">Public Arena</span>
                  )}

                  <Link
                    href={`/floor/${g.id}`}
                    className="py-1.5 px-4 rounded-xl bg-[#1E1E1C] hover:bg-[#C15F3C] text-white font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Custom Arena Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121211] border-2 border-[#C15F3C]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#F4F3EE] uppercase tracking-wide">
              Create Tactical Arena
            </h3>
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8A857B] uppercase">Arena Name</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Monad Social Deduction War"
                  className="bg-[#0A0A0A] border border-[#2C2C29] rounded-xl p-3 text-sm text-[#F4F3EE] outline-none focus:border-[#C15F3C]"
                />
              </div>

              <div className="flex items-center gap-3 bg-[#181816] p-3 rounded-xl border border-[#2C2C29]">
                <input
                  type="checkbox"
                  id="privateCheck"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#C15F3C]"
                />
                <label htmlFor="privateCheck" className="text-xs text-[#F4F3EE] cursor-pointer">
                  Private Room (Requires shareable Room Code to enter)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 rounded-xl bg-[#1E1E1C] text-[#8A857B] font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2.5 rounded-xl bg-[#C15F3C] hover:bg-[#D97757] text-white font-black text-xs uppercase shadow-md flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Deploy Grid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
