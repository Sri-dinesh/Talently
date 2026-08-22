/**
 * AvailableNowGrid Component - Claude Brand Palette
 * Displays online human providers with live availability toggle and skills in warm stone/terracotta theme
 */

"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Users, ShieldCheck, UserCheck, CheckCircle2 } from "lucide-react";
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
    <section className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E6DF] dark:border-[#2C2C29]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C15F3C]/10 dark:bg-[#D97757]/15 flex items-center justify-center text-[#C15F3C] dark:text-[#D97757]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1A1A18] dark:text-[#F4F3EE] flex items-center gap-2">
              <span>Available Now</span>
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] dark:bg-[#4CAF50] animate-pulse" />
            </h2>
            <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">
              Verified humans ready to execute micro-tasks on Monad
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8A857B] dark:text-[#7D7970]">Your Status:</span>
            <button
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                isAvailable
                  ? "bg-[#2E7D32] text-white shadow-xs"
                  : "bg-[#F4F3EE] dark:bg-[#242422] text-[#1A1A18] dark:text-[#F4F3EE] border border-[#E8E6DF] dark:border-[#3A3A36] hover:bg-[#ECEAE4] dark:hover:bg-[#2C2C29]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAvailable ? "bg-white animate-ping" : "bg-[#B1ADA1]"
                }`}
              />
              {isAvailable ? "Available for Tasks" : "Go Online"}
            </button>
          </div>
        )}
      </div>

      {loading && users.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#8A857B] dark:text-[#7D7970]">
          Loading online providers...
        </div>
      ) : users.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#8A857B] dark:text-[#7D7970] space-y-1.5">
          <UserCheck className="w-6 h-6 mx-auto text-[#B1ADA1]" />
          <p className="font-medium text-[#1A1A18] dark:text-[#F4F3EE]">No providers currently online</p>
          <p className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">
            Connect your wallet and click &quot;Go Online&quot; to appear here for tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {users.map((user) => (
            <Link
              key={user.address}
              href={`/profile/${user.address}`}
              className="p-4 rounded-2xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] hover:border-[#C15F3C]/40 dark:hover:border-[#D97757]/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="font-medium text-sm text-[#1A1A18] dark:text-[#F4F3EE] group-hover:text-[#C15F3C] dark:group-hover:text-[#D97757] transition-colors flex items-center gap-1.5">
                    {user.displayName || formatAddress(user.address)}
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#4CAF50] shrink-0" />
                  </div>
                  <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970] font-mono">
                    {formatAddress(user.address)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2E7D32] dark:text-[#4CAF50] bg-[#2E7D32]/10 px-2 py-0.5 rounded-md">
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
                      className="px-2 py-0.5 rounded-md bg-[#F4F3EE] dark:bg-[#242422] text-[10px] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#8A857B] dark:text-[#7D7970]">General QA</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
