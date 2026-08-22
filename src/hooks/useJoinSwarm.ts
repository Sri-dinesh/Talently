// src/hooks/useJoinSwarm.ts
"use client";
import { useState } from "react";

type JoinState = "idle" | "joining" | "success" | "error";

export function useJoinSwarm() {
  const [state, setState] = useState<JoinState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function joinSwarm({
    swarmId,
    workerAddress,
  }: {
    swarmId: string;
    workerAddress: string;
  }) {
    setState("joining");
    setError(null);
    try {
      const res = await fetch(`/api/swarm/${swarmId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerAddress }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to join swarm");
      }
      setState("success");
      return json.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join swarm";
      setError(msg);
      setState("error");
      throw err;
    }
  }

  return { joinSwarm, state, error };
}
