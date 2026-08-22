// src/components/SwarmReport.tsx
"use client";

import { Users, CheckCircle2, AlertTriangle, TrendingUp, Sparkles, Shield } from "lucide-react";
import type { SwarmClusterReport, SwarmFinding } from "@/types/swarm";

interface SwarmReportProps {
  report: SwarmClusterReport;
  isProcessing?: boolean;
}

function ConfidenceRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#2E7D32" : score >= 40 ? "#C26C00" : "#C15F3C";

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#E8E6DF" strokeWidth="6" className="dark:stroke-[#2C2C29]" />
        <circle
          cx="36" cy="36" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-[#1A1A18] dark:text-[#F4F3EE] leading-none">{score}</span>
        <span className="text-[8px] text-[#8A857B] dark:text-[#7D7970] font-medium uppercase tracking-wider">conf</span>
      </div>
    </div>
  );
}

function FindingRow({ finding, index }: { finding: SwarmFinding; index: number }) {
  const severityStyles = {
    High: "bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/20",
    Medium: "bg-[#C26C00]/10 text-[#C26C00] dark:text-[#F59E0B] border border-[#C26C00]/20",
    Low: "bg-[#2E7D32]/10 text-[#2E7D32] dark:text-[#4CAF50] border border-[#2E7D32]/20",
  };

  return (
    <div className="p-3.5 rounded-xl bg-[#FBFBF9] dark:bg-[#181817] border border-[#E8E6DF] dark:border-[#2C2C29] space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] dark:text-[#D97757] flex items-center justify-center text-[10px] font-bold shrink-0">
            {index + 1}
          </span>
          <p className="text-xs font-medium text-[#1A1A18] dark:text-[#F4F3EE] leading-snug line-clamp-2">{finding.summary}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {finding.severity && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${severityStyles[finding.severity as keyof typeof severityStyles] || severityStyles.Low}`}>
              {finding.severity}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-[#1A1A18]/5 dark:bg-[#F4F3EE]/5 text-[#1A1A18] dark:text-[#F4F3EE] text-[10px] font-semibold border border-[#E8E6DF] dark:border-[#2C2C29]">
            {finding.confirmedByCount}×
          </span>
        </div>
      </div>
      {/* Worker address chips */}
      <div className="flex flex-wrap gap-1">
        {finding.workerAddresses.slice(0, 5).map((addr) => (
          <span key={addr} className="text-[9px] font-mono text-[#8A857B] dark:text-[#7D7970] bg-[#F4F3EE] dark:bg-[#242422] px-1.5 py-0.5 rounded">
            {addr.slice(0, 6)}…{addr.slice(-4)}
          </span>
        ))}
        {finding.workerAddresses.length > 5 && (
          <span className="text-[9px] text-[#B1ADA1]">+{finding.workerAddresses.length - 5}</span>
        )}
      </div>
    </div>
  );
}

export function SwarmReport({ report, isProcessing = false }: SwarmReportProps) {
  if (isProcessing) {
    return (
      <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#C15F3C]/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-[#C15F3C] animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">Generating Swarm Intelligence Report…</h3>
        <p className="text-xs text-[#8A857B] dark:text-[#7D7970]">Running clustering, deduplication, and consensus analysis.</p>
      </div>
    );
  }

  const consensusColor = report.consensusScore >= 70 ? "text-[#2E7D32] dark:text-[#4CAF50]"
    : report.consensusScore >= 40 ? "text-[#C26C00] dark:text-[#F59E0B]"
    : "text-[#C15F3C] dark:text-[#D97757]";

  return (
    <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#2C2C29] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-[#FAF9F5] to-[#F4F3EE] dark:from-[#1E1E1C] dark:to-[#181817] border-b border-[#E8E6DF] dark:border-[#2C2C29]">
        <div className="flex items-start gap-5">
          <ConfidenceRing score={report.confidence} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-[#C15F3C] dark:text-[#D97757]" />
              <span className="text-xs font-semibold text-[#C15F3C] dark:text-[#D97757] uppercase tracking-wider">Swarm Intelligence Report</span>
            </div>
            <h2 className="text-lg font-semibold text-[#1A1A18] dark:text-[#F4F3EE] leading-tight mb-3">
              Crowd-Sourced Verification Complete
            </h2>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              <div className="text-center">
                <div className="text-xl font-semibold text-[#1A1A18] dark:text-[#F4F3EE]">{report.participantCount}</div>
                <div className="text-[9px] text-[#8A857B] uppercase tracking-wider font-medium">Workers</div>
              </div>
              <div className="w-px bg-[#E8E6DF] dark:bg-[#2C2C29]" />
              <div className="text-center">
                <div className="text-xl font-semibold text-[#2E7D32] dark:text-[#4CAF50]">{report.validCount}</div>
                <div className="text-[9px] text-[#8A857B] uppercase tracking-wider font-medium">Valid</div>
              </div>
              {report.flaggedCount > 0 && (
                <>
                  <div className="w-px bg-[#E8E6DF] dark:bg-[#2C2C29]" />
                  <div className="text-center">
                    <div className="text-xl font-semibold text-[#C15F3C] dark:text-[#D97757]">{report.flaggedCount}</div>
                    <div className="text-[9px] text-[#8A857B] uppercase tracking-wider font-medium">Flagged</div>
                  </div>
                </>
              )}
              <div className="w-px bg-[#E8E6DF] dark:bg-[#2C2C29]" />
              <div className="text-center">
                <div className={`text-xl font-semibold ${consensusColor}`}>{report.consensusScore}%</div>
                <div className="text-[9px] text-[#8A857B] uppercase tracking-wider font-medium">Consensus</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Top Issue callout */}
        {report.topIssue && (
          <div className="p-4 rounded-2xl bg-[#C15F3C]/5 dark:bg-[#D97757]/8 border border-[#C15F3C]/20 dark:border-[#D97757]/20">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-[#C15F3C] dark:text-[#D97757]" />
              <span className="text-[10px] font-semibold text-[#C15F3C] dark:text-[#D97757] uppercase tracking-wider">
                Top Finding — Confirmed by {report.topIssueConfirmedBy} Workers
              </span>
            </div>
            <p className="text-sm text-[#1A1A18] dark:text-[#F4F3EE] font-medium leading-relaxed">{report.topIssue}</p>
          </div>
        )}

        {/* Consensus meter */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-[#8A857B] dark:text-[#7D7970]">Consensus Score</span>
            <span className={consensusColor}>{report.consensusScore}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#F4F3EE] dark:bg-[#242422] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${report.consensusScore}%`,
                background: report.consensusScore >= 70 ? "#2E7D32" : report.consensusScore >= 40 ? "#C26C00" : "#C15F3C",
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#B1ADA1] mt-1">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>

        {/* Unique Findings */}
        {report.uniqueFindings.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Users className="w-3.5 h-3.5 text-[#C15F3C]" />
              Unique Findings ({report.uniqueFindings.length})
            </h3>
            <div className="space-y-2">
              {report.uniqueFindings.map((finding, idx) => (
                <FindingRow key={finding.id} finding={finding} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {report.aiSummary && (
          <div className="p-4 rounded-2xl bg-[#F4F3EE]/60 dark:bg-[#242422]/60 border border-[#E8E6DF] dark:border-[#3A3A36]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C15F3C] dark:text-[#D97757]" />
              <span className="text-[10px] font-semibold text-[#8A857B] dark:text-[#7D7970] uppercase tracking-wider">AI Oracle Summary</span>
            </div>
            <p className="text-xs text-[#5C5851] dark:text-[#B1ADA1] leading-relaxed">{report.aiSummary}</p>
          </div>
        )}

        {/* Fraud flags */}
        {report.flaggedCount > 0 && (
          <div className="p-3 rounded-xl bg-[#C15F3C]/5 border border-[#C15F3C]/15 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C15F3C] shrink-0" />
            <p className="text-xs text-[#C15F3C] dark:text-[#D97757]">
              {report.flaggedCount} submission{report.flaggedCount > 1 ? "s were" : " was"} rejected by the verification engine (speed anomaly, slop, or insufficient evidence).
            </p>
          </div>
        )}

        {/* Generated at */}
        <p className="text-[10px] text-[#B1ADA1] text-center">
          Report generated · {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
