// src/hooks/useApproveTask.ts
import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, HUMAN_TASK_ESCROW_ABI } from "@/lib/contract";
import type { TaskTransitionState } from "./useCreateTask";

export function useApproveTask() {
  const [state, setState] = useState<TaskTransitionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  async function approveTask({
    taskId,
    onChainId,
  }: {
    taskId: string;
    onChainId: string | number | bigint;
  }) {
    try {
      setError(null);
      setState("saving");

      // (a) Optimistic DB update
      const approveRes = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!approveRes.ok) {
        const err = await approveRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to set approval state");
      }

      // (b) Chain write
      setState("awaiting_signature");
      if (!walletClient || !publicClient) {
        throw new Error("Please connect your wallet");
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: HUMAN_TASK_ESCROW_ABI,
        functionName: "approveTask",
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
        body: JSON.stringify({ txHash, expectedTransition: "approve" }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to sync payout approval");
      }

      setState("done");
      return true;
    } catch (err) {
      setState("error");
      const msg = err instanceof Error ? err.message : "Approval failed";
      setError(msg);
      throw err;
    }
  }

  return { approveTask, state, error, reset: () => setState("idle") };
}
