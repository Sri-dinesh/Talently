/**
 * Swarm Intelligence Engine
 *
 * Processes N independent worker submissions for a single Swarm Task:
 *  1. detectDuplicates  — Jaccard similarity to flag near-identical submissions
 *  2. clusterFindings   — Groups semantically similar findings into unique issues
 *  3. buildConsensusReport — Computes consensus %, confidence, top issue
 *  4. runSwarmAiSummary — Optional DeepSeek executive summary
 *  5. processSwarmCompletion — Orchestrates all layers → saves SwarmClusterReport
 */

import type { SwarmTask, SwarmSubmission, SwarmClusterReport, SwarmFinding } from "@/types/swarm";
import type { VerificationScorecard } from "@/types/verification";

const OPENCODE_ZEN_API_URL =
  process.env.OPENCODE_ZEN_BASE_URL || "https://api.opencode.ai/v1/chat/completions";
const OPENCODE_ZEN_MODEL = process.env.OPENCODE_ZEN_MODEL || "deepseek-v4-flash-free";
const OPENCODE_ZEN_API_KEY = process.env.OPENCODE_ZEN_API_KEY || "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tokenise a string into a lowercase Set of meaningful words (length ≥ 4) */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
  );
}

/** Jaccard similarity between two token sets (0 – 1) */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ---------------------------------------------------------------------------
// 1. Duplicate Detection
// ---------------------------------------------------------------------------

export interface DuplicateFlag {
  submissionId: string;
  duplicateOfId: string;
  similarity: number;
}

/**
 * Flags near-identical submissions (Jaccard ≥ 0.85) as duplicates.
 * Returns a Set of submission IDs that are duplicates (the later occurrence).
 */
export function detectDuplicates(submissions: SwarmSubmission[]): {
  duplicateIds: Set<string>;
  flags: DuplicateFlag[];
} {
  const submitted = submissions.filter((s) => s.resultText && s.resultText.trim().length > 0);
  const tokens = submitted.map((s) => ({
    id: s.id,
    tokens: tokenize(s.resultText || ""),
  }));

  const duplicateIds = new Set<string>();
  const flags: DuplicateFlag[] = [];

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const sim = jaccardSimilarity(tokens[i].tokens, tokens[j].tokens);
      if (sim >= 0.85) {
        // Mark the later submission (j) as duplicate
        duplicateIds.add(tokens[j].id);
        flags.push({
          submissionId: tokens[j].id,
          duplicateOfId: tokens[i].id,
          similarity: Math.round(sim * 100),
        });
      }
    }
  }

  return { duplicateIds, flags };
}

// ---------------------------------------------------------------------------
// 2. Finding Clustering
// ---------------------------------------------------------------------------

/**
 * Groups semantically similar findings into clusters using greedy Jaccard matching.
 * Threshold: 0.25 similarity = same topic cluster.
 */
export function clusterFindings(
  submissions: SwarmSubmission[],
  excludeIds: Set<string>
): SwarmFinding[] {
  // Only cluster verified/reviewed submissions with meaningful text
  const valid = submissions.filter(
    (s) =>
      !excludeIds.has(s.id) &&
      s.resultText &&
      s.resultText.trim().length >= 20
  );

  if (valid.length === 0) return [];

  const clusters: {
    tokens: Set<string>;
    submissions: SwarmSubmission[];
    centroidText: string;
  }[] = [];

  for (const sub of valid) {
    const subTokens = tokenize(sub.resultText || "");
    let bestCluster: (typeof clusters)[0] | null = null;
    let bestSim = 0;

    for (const cluster of clusters) {
      const sim = jaccardSimilarity(subTokens, cluster.tokens);
      if (sim > bestSim && sim >= 0.25) {
        bestSim = sim;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.submissions.push(sub);
      // Expand cluster token set to include new tokens
      for (const tok of subTokens) bestCluster.tokens.add(tok);
    } else {
      clusters.push({
        tokens: subTokens,
        submissions: [sub],
        centroidText: sub.resultText || "",
      });
    }
  }

  // Convert clusters → SwarmFinding[]
  return clusters
    .filter((c) => c.submissions.length > 0)
    .sort((a, b) => b.submissions.length - a.submissions.length) // Sort by confirmation count desc
    .map((c, idx) => {
      // Dominant severity
      const severities = c.submissions.map((s) => s.resultSeverity).filter(Boolean);
      const severityCount: Record<string, number> = {};
      for (const sev of severities) {
        if (sev) severityCount[sev] = (severityCount[sev] || 0) + 1;
      }
      const dominantSeverity = (
        Object.entries(severityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null
      ) as "Low" | "Medium" | "High" | null;

      // Representative text: longest submission in cluster
      const representative = c.submissions.reduce((best, s) =>
        (s.resultText?.length || 0) > (best.resultText?.length || 0) ? s : best
      );

      // Generate a concise summary from the first 80 chars of the representative
      const preview = (representative.resultText || "").slice(0, 80).trim();
      const summary = preview.length < (representative.resultText || "").length
        ? `${preview}…`
        : preview;

      return {
        id: `finding_${idx + 1}`,
        summary,
        confirmedByCount: c.submissions.length,
        workerAddresses: c.submissions.map((s) => s.workerAddress),
        severity: dominantSeverity,
        representativeText: representative.resultText || "",
      };
    });
}

// ---------------------------------------------------------------------------
// 3. Consensus Report Builder
// ---------------------------------------------------------------------------

export function buildConsensusReport(
  swarmTask: SwarmTask,
  submissions: SwarmSubmission[],
  scorecards: Array<{ submissionId: string; scorecard: VerificationScorecard | null }>
): Omit<SwarmClusterReport, "aiSummary" | "generatedAt"> {
  const totalParticipants = submissions.filter((s) => s.submittedAt).length;

  // Identify valid (PASS/REVIEW) vs flagged (FAIL/REJECTED)
  const validSubmissions = submissions.filter((s) =>
    s.verificationScorecard
      ? s.verificationScorecard.verdict !== "FAIL"
      : s.resultText && s.resultText.trim().length >= 20
  );
  const flaggedCount = totalParticipants - validSubmissions.length;

  // Detect duplicates first, then cluster
  const { duplicateIds } = detectDuplicates(validSubmissions);
  const uniqueFindings = clusterFindings(validSubmissions, duplicateIds);

  const topFinding = uniqueFindings[0] || null;
  const topIssueConfirmedBy = topFinding?.confirmedByCount || 0;

  // Consensus: % of valid workers confirming the top issue
  const consensusScore =
    validSubmissions.length > 0
      ? Math.round((topIssueConfirmedBy / validSubmissions.length) * 100)
      : 0;

  // Confidence: weighted average of individual composite scores
  const validScorecards = scorecards
    .filter((sc) => sc.scorecard && sc.scorecard.verdict !== "FAIL")
    .map((sc) => sc.scorecard!.compositeScore);
  const confidence =
    validScorecards.length > 0
      ? Math.round(validScorecards.reduce((a, b) => a + b, 0) / validScorecards.length)
      : 0;

  return {
    participantCount: totalParticipants,
    validCount: validSubmissions.length,
    flaggedCount,
    uniqueFindings,
    topIssue: topFinding ? topFinding.summary : null,
    topIssueConfirmedBy,
    consensusScore,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// 4. Optional AI Executive Summary
// ---------------------------------------------------------------------------

export async function runSwarmAiSummary(
  swarmTask: SwarmTask,
  report: Omit<SwarmClusterReport, "aiSummary" | "generatedAt">
): Promise<string | null> {
  if (!OPENCODE_ZEN_API_KEY) return null;

  const prompt = `You are an AI analyst for the Human Swarm Protocol.
Summarise the following crowd-sourced task verification results in 2-3 concise sentences.
Focus on the top finding, confidence level, and any notable fraud flags.
Do NOT use markdown. Return plain text only.

Task: "${swarmTask.title}"
Participants: ${report.participantCount}
Valid Submissions: ${report.validCount}
Flagged/Rejected: ${report.flaggedCount}
Top Issue: "${report.topIssue || "No dominant issue found"}"
Confirmed By: ${report.topIssueConfirmedBy} workers
Consensus Score: ${report.consensusScore}%
Confidence: ${report.confidence}%
Unique Findings: ${report.uniqueFindings.length}`;

  try {
    const res = await fetch(OPENCODE_ZEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCODE_ZEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENCODE_ZEN_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. Swarm Completion Orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the full Swarm Intelligence pipeline on a completed set of submissions.
 * Returns the final SwarmClusterReport ready to be saved.
 */
export async function processSwarmCompletion(
  swarmTask: SwarmTask,
  submissions: SwarmSubmission[]
): Promise<SwarmClusterReport> {
  const scorecards = submissions.map((s) => ({
    submissionId: s.id,
    scorecard: s.verificationScorecard,
  }));

  const partialReport = buildConsensusReport(swarmTask, submissions, scorecards);
  const aiSummary = await runSwarmAiSummary(swarmTask, partialReport);

  return {
    ...partialReport,
    aiSummary,
    generatedAt: new Date().toISOString(),
  };
}
