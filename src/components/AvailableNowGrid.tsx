/**
 * AvailableNowGrid Component
 * Displays available human providers with live availability toggle and skills
 */

"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Users, CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";
import type { User } from "@/types/task";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

export function AvailableNowGrid() {
  const { address, isConnected } = useAccount();
  const [users, setUsers] = useState<User[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function checkMyStatus() {
    if (!address) return;
    try {
      const res = await fetch(`/api/users/${address.toLowerCase()}`);
      if (res.ok) {
        const json = await res.json();
        setIsAvailable(Boolean(json.data?.isAvailable));
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchUsers();
    if (address) {
      checkMyStatus();
    }
  }, [address]);

  async function handleToggleAvailability() {
    if (!address) return;
    try {
      setToggling(true);
      const nextState = !isAvailable;
      setIsAvailable(nextState);
      await fetch(`/api/users/${address.toLowerCase()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      await fetchUsers();
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Available Now
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">
              Verified humans ready to execute micro-tasks on Monad
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Your Status:</span>
            <button
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isAvailable
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAvailable ? "bg-white animate-ping" : "bg-slate-500"
                }`}
              />
              {isAvailable ? "Available for Tasks" : "Go Online"}
            </button>
          </div>
        )}
      </div>

      {loading && users.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Loading online providers...
        </div>
      ) : users.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 space-y-1">
          <UserCheck className="w-6 h-6 mx-auto text-slate-600" />
          <p>No providers currently online.</p>
          <p className="text-[11px] text-slate-600">
            Connect your wallet and click &quot;Go Online&quot; to appear here for tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {users.map((user) => (
            <Link
              key={user.address}
              href={`/profile/${user.address}`}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="font-semibold text-sm text-slate-200 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    {user.displayName || formatAddress(user.address)}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatAddress(user.address)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    {user.tasksApproved} done
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {user.skills && user.skills.length > 0 ? (
                  user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500">General QA</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
