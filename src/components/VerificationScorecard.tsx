/**
 * VerificationScorecard Component — Claude Luxury Theme
 * Visualizes the 4-Layer Verification Engine results with verdicts, sub-scores, criteria checklist, and anomaly badges.
 */

"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  FileCheck2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { VerificationScorecard as ScorecardType } from "@/types/verification";

export function VerificationScorecard({
  scorecard,
}: {
  scorecard: ScorecardType;
}) {
  const isPass = scorecard.verdict === "PASS";
  const isReview = scorecard.verdict === "REVIEW";
  const isFail = scorecard.verdict === "FAIL";

  const verdictColor = isPass
    ? "text-[#2E7D32] dark:text-[#4CAF50] bg-[#2E7D32]/10 border-[#2E7D32]/25"
    : isReview
    ? "text-[#C26C00] dark:text-[#F59E0B] bg-[#C26C00]/10 border-[#C26C00]/25"
    : "text-[#C15F3C] dark:text-[#D97757] bg-[#C15F3C]/10 border-[#C15F3C]/25";

  return (
    <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header: Verdict Banner & Composite Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E6DF] dark:border-[#2C2C29]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${verdictColor}`}
            >
              {isPass && <CheckCircle2 className="w-4 h-4" />}
              {isReview && <AlertTriangle className="w-4 h-4" />}
              {isFail && <XCircle className="w-4 h-4" />}
              <span>
                {isPass && "VERDICT: PASS (AUTOMATED APPROVAL)"}
                {isReview && "VERDICT: REVIEW (MANUAL AUDIT NEEDED)"}
                {isFail && "VERDICT: FAIL (CRITERIA NOT MET)"}
              </span>
            </span>
          </div>
          <p className="text-xs text-[#8A857B] dark:text-[#7D7970] pt-1">
            {isPass
              ? "All acceptance criteria and evidence requirements have been verified."
              : isReview
              ? "Minor discrepancy or velocity anomaly detected. Requester inspection advised."
              : "Submission lacks required evidence or criteria satisfaction."}
          </p>
        </div>

        {/* Big Composite Score */}
        <div className="sm:text-right shrink-0 p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] min-w-[120px]">
          <span className="text-[10px] font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider block">
            Verification Score
          </span>
          <div className="text-2xl font-bold font-mono text-[#1A1A18] dark:text-[#F4F3EE] mt-0.5">
            {scorecard.compositeScore}
            <span className="text-xs font-normal text-[#8A857B] dark:text-[#7D7970]">
              /100
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Requirements */}
        <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A857B] dark:text-[#7D7970] font-medium flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-[#C15F3C] dark:text-[#D97757]" />
              <span>Criteria Met</span>
            </span>
            <span className="font-mono font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
              {scorecard.requirementsMet} / {scorecard.requirementsTotal}
            </span>
          </div>
          <div className="w-full bg-[#E8E6DF] dark:bg-[#2C2C29] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2E7D32] dark:bg-[#4CAF50] h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.requirementsScore}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Evidence Integrity */}
        <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A857B] dark:text-[#7D7970] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#4CAF50]" />
              <span>Evidence Integrity</span>
            </span>
            <span className="font-mono font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
              {scorecard.evidenceScore}%
            </span>
          </div>
          <div className="w-full bg-[#E8E6DF] dark:bg-[#2C2C29] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#C15F3C] dark:bg-[#D97757] h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.evidenceScore}%` }}
            />
          </div>
        </div>

        {/* Metric 3: AI Quality Depth */}
        <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A857B] dark:text-[#7D7970] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C15F3C] dark:text-[#D97757]" />
              <span>Content Depth</span>
            </span>
            <span className="font-mono font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">
              {scorecard.qualityScore}%
            </span>
          </div>
          <div className="w-full bg-[#E8E6DF] dark:bg-[#2C2C29] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1A1A18] dark:bg-[#F4F3EE] h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.qualityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Anomaly & Velocity Warning Pills if any */}
      {scorecard.anomalyFlags && scorecard.anomalyFlags.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#C26C00]/8 border border-[#C26C00]/25 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C26C00] dark:text-[#F59E0B]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Anomaly Signals Detected:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {scorecard.anomalyFlags.map((flag) => (
              <span
                key={flag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#C26C00]/30 text-[#C26C00] dark:text-[#F59E0B] text-xs font-medium"
              >
                {flag === "SPEED_ANOMALY" && "⚡ Lightning Speed Submission"}
                {flag === "GENERIC_SLOP" && "⚠️ Low Substance / Generic Text"}
                {flag === "MINIMAL_SUBSTANCE" && "📄 Short Findings Text"}
                {flag === "INVALID_EVIDENCE_URL" && "🔗 Unreachable Evidence Link"}
                {!["SPEED_ANOMALY", "GENERIC_SLOP", "MINIMAL_SUBSTANCE", "INVALID_EVIDENCE_URL"].includes(flag) && flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Criteria Breakdown Checklist */}
      {scorecard.criteriaBreakdown && scorecard.criteriaBreakdown.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <span className="text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider block">
            Acceptance Criteria Verification
          </span>
          <div className="space-y-2">
            {scorecard.criteriaBreakdown.map((crit, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] flex items-start gap-2.5 text-xs"
              >
                {crit.met ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-[#4CAF50] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#C15F3C] dark:text-[#D97757] shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1">
                  <div className="font-medium text-[#1A1A18] dark:text-[#F4F3EE]">
                    {crit.requirement}
                  </div>
                  {crit.reason && (
                    <div className="text-[11px] text-[#8A857B] dark:text-[#7D7970]">
                      {crit.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Oracle Explanation */}
      {scorecard.explanation && (
        <div className="p-4 rounded-2xl bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] text-xs space-y-1">
          <span className="font-semibold text-[#1A1A18] dark:text-[#F4F3EE] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C15F3C] dark:text-[#D97757]" />
            <span>Verification Oracle Assessment:</span>
          </span>
          <p className="text-[#5C5851] dark:text-[#B1ADA1] leading-relaxed">
            {scorecard.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
