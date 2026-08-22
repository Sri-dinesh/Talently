// src/hooks/useCancelTask.ts
import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, HUMAN_TASK_ESCROW_ABI } from "@/lib/contract";
import type { TaskTransitionState } from "./useCreateTask";

export function useCancelTask() {
  const [state, setState] = useState<TaskTransitionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  async function cancelTask({
    taskId,
    onChainId,
  }: {
    taskId: string;
    onChainId: string | number | bigint;
  }) {
    try {
      setError(null);
      setState("awaiting_signature");
      if (!walletClient || !publicClient) {
        throw new Error("Please connect your wallet");
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: HUMAN_TASK_ESCROW_ABI,
        functionName: "cancelTask",
        args: [BigInt(onChainId.toString())],
      });

      setState("confirming");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setState("syncing");
      const patchRes = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, expectedTransition: "cancel" }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to sync cancellation");
      }

      setState("done");
      return true;
    } catch (err) {
      setState("error");
      const msg = err instanceof Error ? err.message : "Cancellation failed";
      setError(msg);
      throw err;
    }
  }

  return { cancelTask, state, error, reset: () => setState("idle") };
}
