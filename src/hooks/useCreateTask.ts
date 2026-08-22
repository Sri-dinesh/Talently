// src/hooks/useCreateTask.ts
import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS, HUMAN_TASK_ESCROW_ABI } from "@/lib/contract";

export type CreateTaskInput = {
  title: string;
  description: string;
  category?: string;
  skills?: string[];
  rewardEth: string; // human-entered "0.01", converted to wei internally
  estimatedMinutes?: number;
  requesterAddress: string;
};

export type TaskTransitionState =
  | "idle"
  | "saving"
  | "awaiting_signature"
  | "confirming"
  | "syncing"
  | "done"
  | "error";

export function useCreateTask() {
  const [state, setState] = useState<TaskTransitionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  async function createTask(input: CreateTaskInput): Promise<string> {
    try {
      setError(null);
      setState("saving");
      const rewardWei = parseEther(input.rewardEth).toString();

      // (a) Optimistic DB write
      const createRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, rewardWei }),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to initialize task");
      }
      const { data: task } = await createRes.json();

      // (b) Chain write
      setState("awaiting_signature");
      if (!walletClient || !publicClient) {
        throw new Error("Wallet not connected to Monad testnet");
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: HUMAN_TASK_ESCROW_ABI,
        functionName: "createTask",
        value: BigInt(rewardWei),
      });

      // (c) Confirmation wait
      setState("confirming");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // (d) Reconciliation
      setState("syncing");
      const patchRes = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, expectedTransition: "create" }),
      });

      if (!patchRes.ok) {
        const patchErr = await patchRes.json().catch(() => ({}));
        throw new Error(patchErr.error?.message || "Failed to sync confirmed task");
      }

      setState("done");
      return task.id;
    } catch (err) {
      setState("error");
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      throw err;
    }
  }

  return { createTask, state, error, reset: () => setState("idle") };
}
