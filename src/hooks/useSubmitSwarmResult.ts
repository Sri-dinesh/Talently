// src/hooks/useSubmitSwarmResult.ts
"use client";
import { useState } from "react";

type SubmitSwarmState = "idle" | "submitting" | "success" | "error";

export function useSubmitSwarmResult() {
  const [state, setState] = useState<SubmitSwarmState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submitSwarmResult({
    swarmId,
    workerAddress,
    resultText,
    resultSeverity,
    resultAttachmentUrl,
  }: {
    swarmId: string;
    workerAddress: string;
    resultText: string;
    resultSeverity?: "Low" | "Medium" | "High" | null;
    resultAttachmentUrl?: string | null;
  }) {
    setState("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/swarm/${swarmId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerAddress,
          resultText,
          resultSeverity: resultSeverity || null,
          resultAttachmentUrl: resultAttachmentUrl || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to submit swarm result");
      }
      setState("success");
      return json.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      setError(msg);
      setState("error");
      throw err;
    }
  }

  return { submitSwarmResult, state, error };
}
