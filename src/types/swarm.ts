// src/types/swarm.ts
import type { VerificationScorecard } from "./verification";

export type SwarmStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type SwarmSubmissionStatus =
  | "EXECUTING"
  | "SUBMITTED"
  | "VERIFIED"
  | "PAID_OUT"
  | "REJECTED"
  | "REFUNDED"
  | "FLAGGED";

/**
 * A unique clustered finding from multiple workers' submissions.
 */
export interface SwarmFinding {
  id: string;
  summary: string;
  confirmedByCount: number;
  workerAddresses: string[];
  severity: "Low" | "Medium" | "High" | null;
  representativeText: string;
}

/**
 * The Swarm Intelligence Report — produced after all workers submit.
 */
export interface SwarmClusterReport {
  participantCount: number;
  validCount: number;
  flaggedCount: number;
  uniqueFindings: SwarmFinding[];
  topIssue: string | null;
  topIssueConfirmedBy: number;
  consensusScore: number;
  confidence: number;
  aiSummary: string | null;
  generatedAt: string;
}

/**
 * A single worker's submission within a Swarm batch.
 */
export interface SwarmSubmission {
  id: string;
  swarmId: string;
  workerAddress: string;
  status: SwarmSubmissionStatus;
  resultText: string | null;
  resultSeverity: "Low" | "Medium" | "High" | string | null;
  resultAttachmentUrl: string | null;
  verificationScorecard: VerificationScorecard | null;
  acceptedAt: string | null;
  submittedAt: string | null;
  payoutTxHash: string | null;
  refundTxHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A Swarm Task — one task executed by N independent workers in parallel.
 */
export interface SwarmTask {
  id: string;
  title: string;
  description: string;
  category: string | null;
  skills: string[];
  requirements: string[];
  rewardWeiPerWorker: string;
  estimatedMinutes: number | null;
  maxWorkers: number;
  status: SwarmStatus;
  requesterAddress: string;
  refundedWei?: string;
  submissions?: SwarmSubmission[];
  clusterReport: SwarmClusterReport | null;
  createdAt: string;
  updatedAt: string;
}
