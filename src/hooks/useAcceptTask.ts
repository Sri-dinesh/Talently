// src/hooks/useAcceptTask.ts
import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, HUMAN_TASK_ESCROW_ABI } from "@/lib/contract";
import type { TaskTransitionState } from "./useCreateTask";

export function useAcceptTask() {
  const [state, setState] = useState<TaskTransitionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  async function acceptTask({
    taskId,
    onChainId,
    providerAddress,
  }: {
    taskId: string;
    onChainId: string | number | bigint;
    providerAddress: string;
  }) {
    try {
      setError(null);
      setState("saving");

      // (a) Optimistic DB update
      const acceptRes = await fetch(`/api/tasks/${taskId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerAddress }),
      });

      if (!acceptRes.ok) {
        const err = await acceptRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to record acceptance");
      }

      // (b) Chain write
      setState("awaiting_signature");
      if (!walletClient || !publicClient) {
        throw new Error("Please connect your wallet");
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: HUMAN_TASK_ESCROW_ABI,
        functionName: "acceptTask",
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
        body: JSON.stringify({ txHash, expectedTransition: "accept" }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to sync acceptance status");
      }

      setState("done");
      return true;
    } catch (err) {
      setState("error");
      const msg = err instanceof Error ? err.message : "Acceptance failed";
      setError(msg);
      throw err;
    }
  }

  return { acceptTask, state, error, reset: () => setState("idle") };
}
