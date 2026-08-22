// src/types/verification.ts

export type VerificationVerdict = "PASS" | "REVIEW" | "FAIL";

export interface CriteriaCheck {
  requirement: string;
  met: boolean;
  reason: string;
}

export interface VerificationScorecard {
  verdict: VerificationVerdict;
  compositeScore: number; // 0 - 100
  requirementsScore: number; // 0 - 100
  requirementsMet: number;
  requirementsTotal: number;
  evidenceScore: number; // 0 - 100
  qualityScore: number; // 0 - 100
  anomalyFlags: string[]; // e.g. "SPEED_ANOMALY", "MINIMAL_SUBSTANCE", "GENERIC_SLOP"
  completionTimeSeconds: number;
  explanation: string;
  criteriaBreakdown: CriteriaCheck[];
  evaluatedAt: string;
}
