// src/types/task.ts
import type { VerificationScorecard } from "./verification";

export type TaskStatus =
  | "PENDING_CHAIN"
  | "OPEN"
  | "PENDING_ACCEPT"
  | "ACCEPTED"
  | "PENDING_SUBMIT"
  | "SUBMITTED"
  | "PENDING_APPROVE"
  | "APPROVED"
  | "CANCELLED"
  | "FAILED";

export interface User {
  address: string;
  displayName: string | null;
  skills: string[];
  tasksCompleted: number;
  tasksApproved: number;
  isAvailable: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Task {
  id: string;
  onChainId: string | number | bigint | null;
  title: string;
  description: string;
  category: string | null;
  skills: string[];
  requirements?: string[]; // Structured acceptance criteria checklist
  rewardWei: string; // Stored as decimal string to avoid BigInt JSON serialization errors
  estimatedMinutes: number | null;
  status: TaskStatus;

  requesterAddress: string;
  requester?: User;
  providerAddress: string | null;
  provider?: User | null;

  resultText: string | null;
  resultSeverity: "Low" | "Medium" | "High" | string | null;
  resultAttachmentUrl: string | null;
  verificationScorecard?: VerificationScorecard | null; // 4-layer verification results

  createTxHash: string | null;
  acceptTxHash: string | null;
  submitTxHash: string | null;
  approveTxHash: string | null;

  acceptedAt?: string | null; // For time-velocity calculation
  submittedAt?: string | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}
