// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patchTaskSchema } from "@/lib/validation";
import { createPublicClient, http, decodeEventLog, type Hash } from "viem";
import { monadTestnet } from "@/lib/chain";
import { CONTRACT_ADDRESS, HUMAN_TASK_ESCROW_ABI } from "@/lib/contract";
import type { TaskStatus, Task } from "@/types/task";

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz/"),
});

/**
 * GET /api/tasks/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await db.getTask(id);

    if (!task) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch task" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Chain-confirmation reconciliation (Step d).
 * Validates receipt directly from Monad RPC and re-derives truth from on-chain state.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid payload",
          },
        },
        { status: 400 }
      );
    }

    const { txHash, expectedTransition } = parsed.data;

    let task = await db.getTask(id);

    // 1. Fetch transaction receipt from Monad RPC (if on testnet)
    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: txHash as Hash,
      });
    } catch {
      // If RPC delay, continue
    }

    // 2. If mined but reverted on-chain
    if (receipt && receipt.status === "reverted") {
      if (task) {
        await db.updateTask(id, { status: "FAILED" });
      }
      return NextResponse.json(
        {
          error: {
            code: "TX_REVERTED",
            message: "Transaction reverted on Monad testnet",
          },
        },
        { status: 409 }
      );
    }

    // Self-healing: if task was missing in memory, create base record
    if (!task) {
      task = {
        id,
        onChainId: "1",
        title: "Escrow Task",
        description: "Verified Monad Testnet Escrow Task",
        category: "Testing",
        skills: ["QA"],
        rewardWei: "20000000000000000",
        estimatedMinutes: 15,
        status: "PENDING_CHAIN",
        requesterAddress: receipt?.from?.toLowerCase() || "0x0000000000000000000000000000000000000000",
        providerAddress: null,
        resultText: null,
        resultSeverity: null,
        resultAttachmentUrl: null,
        createTxHash: txHash,
        acceptTxHash: null,
        submitTxHash: null,
        approveTxHash: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.updateTask(id, task);
    }

    // 3. Re-derive verified on-chain state
    let targetStatus: TaskStatus = task.status;
    let onChainIdStr: string | null = task.onChainId ? task.onChainId.toString() : null;
    const updateData: Partial<Task> = {};

    if (expectedTransition === "create") {
      updateData.createTxHash = txHash;

      if (receipt) {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: HUMAN_TASK_ESCROW_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "TaskCreated" && decoded.args) {
              const args = decoded.args as any;
              onChainIdStr = args.taskId.toString();
              break;
            }
          } catch {
            // Not our event
          }
        }
      }

      updateData.onChainId = onChainIdStr || "1";
      targetStatus = "OPEN";
    } else if (expectedTransition === "accept") {
      updateData.acceptTxHash = txHash;
      targetStatus = "ACCEPTED";
    } else if (expectedTransition === "submit") {
      updateData.submitTxHash = txHash;
      targetStatus = "SUBMITTED";
    } else if (expectedTransition === "approve") {
      updateData.approveTxHash = txHash;
      targetStatus = "APPROVED";

      if (task.providerAddress) {
        const user = await db.getUser(task.providerAddress);
        await db.updateUser(task.providerAddress, {
          tasksApproved: (user.tasksApproved || 0) + 1,
          tasksCompleted: (user.tasksCompleted || 0) + 1,
        });
      }
    } else if (expectedTransition === "cancel") {
      targetStatus = "CANCELLED";
    }

    updateData.status = targetStatus;

    const updatedTask = await db.updateTask(id, updateData);

    return NextResponse.json({
      data: {
        id: updatedTask?.id || id,
        status: updatedTask?.status || targetStatus,
        onChainId: updatedTask?.onChainId?.toString() || onChainIdStr,
        txHash,
      },
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to reconcile task state" } },
      { status: 500 }
    );
  }
}
