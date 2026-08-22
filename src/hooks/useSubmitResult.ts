// src/hooks/useSubmitResult.ts
import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, HUMAN_TASK_ESCROW_ABI } from "@/lib/contract";
import type { TaskTransitionState } from "./useCreateTask";

export function useSubmitResult() {
  const [state, setState] = useState<TaskTransitionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  async function submitResult({
    taskId,
    onChainId,
    resultText,
    resultSeverity,
    resultAttachmentUrl,
  }: {
    taskId: string;
    onChainId: string | number | bigint;
    resultText: string;
    resultSeverity?: "Low" | "Medium" | "High";
    resultAttachmentUrl?: string;
  }) {
    try {
      setError(null);
      setState("saving");

      // (a) Optimistic DB update
      const submitRes = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultText,
          resultSeverity,
          resultAttachmentUrl,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to store task result");
      }

      // (b) Chain write
      setState("awaiting_signature");
      if (!walletClient || !publicClient) {
        throw new Error("Please connect your wallet");
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: HUMAN_TASK_ESCROW_ABI,
        functionName: "submitResult",
        args: [BigInt(onChainId.toString())],
      });

      // (c) Confirmation wait
      setState("confirming");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // (d) Reconciliation
      setState("syncing");
      const patchRes = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, expectedTransition: "submit" }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to sync submission state");
      }

      setState("done");
      return true;
    } catch (err) {
      setState("error");
      const msg = err instanceof Error ? err.message : "Submission failed";
      setError(msg);
      throw err;
    }
  }

  return { submitResult, state, error, reset: () => setState("idle") };
}
