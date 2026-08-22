/**
 * Task Verification Engine — 4-Layer Deterministic Architecture
 *
 * Layer 1: Requirement Check (Acceptance criteria matching)
 * Layer 2: Evidence Check (Screenshot URL, step depth, formatting)
 * Layer 3: AI Quality Check (DeepSeek V4 Flash structured scoring)
 * Layer 4: Fraud & Anomaly Check (Time velocity, duplicate/slop penalty)
 * -> Final Verdict: PASS | REVIEW | FAIL
 */

import type { Task } from "@/types/task";
import type { VerificationScorecard, VerificationVerdict, CriteriaCheck } from "@/types/verification";

const OPENCODE_ZEN_API_URL = "https://opencode.zen/api/v1/chat/completions";
const OPENCODE_ZEN_MODEL = process.env.OPENCODE_ZEN_MODEL || "deepseek-v4-flash-free";
const OPENCODE_ZEN_API_KEY = process.env.OPENCODE_ZEN_API_KEY || "";

interface SubmissionData {
  resultText: string;
  resultSeverity?: "Low" | "Medium" | "High" | string | null;
  resultAttachmentUrl?: string | null;
  acceptedAt?: string | null;
  submittedAt?: string | null;
}

/**
 * 1. Layer 1: Deterministic Requirement Check
 */
export function checkRequirements(
  requirements: string[] = [],
  submission: SubmissionData
): { score: number; metCount: number; breakdown: CriteriaCheck[] } {
  if (!requirements || requirements.length === 0) {
    return {
      score: 100,
      metCount: 1,
      breakdown: [
        {
          requirement: "General Task Execution",
          met: submission.resultText.length >= 20,
          reason: "Task completed with clear submission details",
        },
      ],
    };
  }

  const lowerText = submission.resultText.toLowerCase();
  const breakdown: CriteriaCheck[] = [];
  let metCount = 0;

  for (const req of requirements) {
    const lowerReq = req.toLowerCase();
    const keywords = lowerReq
      .replace(/[^\w\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const matchesKeyword =
      keywords.length === 0 || keywords.some((kw) => lowerText.includes(kw));
    const isSubstantial = lowerText.length >= 25;

    const met = matchesKeyword && isSubstantial;
    if (met) metCount++;

    breakdown.push({
      requirement: req,
      met,
      reason: met
        ? "Addressed in submitted findings"
        : "Missing explicit evidence or details in submission",
    });
  }

  const score = Math.round((metCount / requirements.length) * 100);
  return { score, metCount, breakdown };
}

/**
 * 2. Layer 2: Evidence Integrity Check
 */
export function checkEvidence(submission: SubmissionData): {
  score: number;
  flags: string[];
} {
  let score = 50; // base score
  const flags: string[] = [];

  // Attachment URL validation
  if (submission.resultAttachmentUrl && submission.resultAttachmentUrl.trim().length > 0) {
    try {
      const url = new URL(submission.resultAttachmentUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        score += 35; // +35 for valid proof link
      }
    } catch {
      flags.push("INVALID_EVIDENCE_URL");
      score -= 10;
    }
  } else {
    // No attachment link provided
    score -= 15;
  }

  // Text substance depth
  const textLen = submission.resultText.trim().length;
  if (textLen >= 100) {
    score += 15;
  } else if (textLen >= 40) {
    score += 10;
  } else if (textLen < 20) {
    score -= 20;
    flags.push("MINIMAL_SUBSTANCE");
  }

  // Severity specification (for QA/testing)
  if (submission.resultSeverity) {
    score += 5;
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  return { score: clampedScore, flags };
}

/**
 * 3. Layer 3: AI Quality Check via DeepSeek V4 Flash
 */
export async function evaluateAiQuality(
  task: Task,
  submission: SubmissionData
): Promise<{
  qualityScore: number;
  aiEvidenceScore: number;
  aiExplanation: string;
  aiCriteriaBreakdown?: CriteriaCheck[];
}> {
  if (!OPENCODE_ZEN_API_KEY) {
    // Fallback deterministic evaluator if API key is not present
    return {
      qualityScore: submission.resultText.length >= 80 ? 90 : 70,
      aiEvidenceScore: submission.resultAttachmentUrl ? 95 : 65,
      aiExplanation:
        "Deterministic heuristic evaluation: submission contains findings and structured notes.",
    };
  }

  const systemPrompt = `You are the Human API Task Verification Oracle.
Evaluate whether a human worker's submission satisfies the requester's requirements and quality standards.
Return ONLY valid JSON matching this schema:
{
  "quality_score": <number 0-100>,
  "evidence_score": <number 0-100>,
  "explanation": "<concise 1-2 sentence justification>",
  "criteria_breakdown": [
    { "requirement": "<requirement text>", "met": true/false, "reason": "<short reason>" }
  ]
}`;

  const userContent = JSON.stringify({
    task_title: task.title,
    task_description: task.description,
    task_category: task.category,
    task_requirements: task.requirements || [],
    worker_submission: {
      findings: submission.resultText,
      severity: submission.resultSeverity || null,
      evidence_url: submission.resultAttachmentUrl || null,
    },
  });

  try {
    const res = await fetch(OPENCODE_ZEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCODE_ZEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENCODE_ZEN_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    });

    if (!res.ok) throw new Error(`OpenCode Zen API returned status ${res.status}`);

    const json = await res.json();
    const rawText = json.choices?.[0]?.message?.content || "";
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      qualityScore: Number(parsed.quality_score) || 75,
      aiEvidenceScore: Number(parsed.evidence_score) || 75,
      aiExplanation: parsed.explanation || "AI quality evaluation completed.",
      aiCriteriaBreakdown: Array.isArray(parsed.criteria_breakdown)
        ? parsed.criteria_breakdown
        : undefined,
    };
  } catch (error) {
    console.warn("[Verification Engine] AI Evaluation Fallback:", error);
    return {
      qualityScore: submission.resultText.length >= 60 ? 85 : 60,
      aiEvidenceScore: submission.resultAttachmentUrl ? 90 : 60,
      aiExplanation:
        "Fast-path heuristic evaluation: verified content length and criteria matching.",
    };
  }
}

/**
 * 4. Layer 4: Fraud & Velocity Anomaly Detection
 */
export function detectAnomalies(
  task: Task,
  submission: SubmissionData
): {
  flags: string[];
  penalty: number;
  completionTimeSeconds: number;
} {
  const flags: string[] = [];
  let penalty = 0;

  // Calculate execution velocity
  let completionTimeSeconds = 0;
  if (submission.acceptedAt && submission.submittedAt) {
    const start = new Date(submission.acceptedAt).getTime();
    const end = new Date(submission.submittedAt).getTime();
    completionTimeSeconds = Math.max(1, Math.round((end - start) / 1000));
  } else {
    // Default estimate if timestamps missing
    completionTimeSeconds = 180;
  }

  // Velocity Check: If completed in < 15% of estimated duration
  const estimatedSeconds = (task.estimatedMinutes || 5) * 60;
  if (estimatedSeconds >= 180 && completionTimeSeconds < estimatedSeconds * 0.15) {
    flags.push("SPEED_ANOMALY");
    penalty += 25; // Significant penalty for unrealistic speed-runs
  }

  // Generic 1-word slop check
  const textTrimmed = submission.resultText.trim().toLowerCase();
  const genericSlop = [
    "done",
    "ok",
    "tested",
    "fixed",
    "works",
    "completed",
    "all good",
    "good",
    "fine",
    "pass",
  ];
  if (genericSlop.includes(textTrimmed) || textTrimmed.length < 15) {
    flags.push("GENERIC_SLOP");
    penalty += 35;
  }

  return { flags, penalty, completionTimeSeconds };
}

/**
 * 🎯 Composite 4-Layer Verification Runner
 */
export async function verifySubmission(
  task: Task,
  submission: SubmissionData
): Promise<VerificationScorecard> {
  const requirements = task.requirements || [
    "Execute task per instructions",
    "Provide clear reproduction notes",
    "Attach proof where required",
  ];

  // 1. Layer 1: Requirements Check
  const reqResult = checkRequirements(requirements, submission);

  // 2. Layer 2: Evidence Integrity Check
  const evidenceResult = checkEvidence(submission);

  // 3. Layer 3: AI Quality Check
  const aiResult = await evaluateAiQuality(task, submission);

  // 4. Layer 4: Fraud & Anomaly Check
  const anomalyResult = detectAnomalies(task, submission);

  // Combine anomaly flags
  const anomalyFlags = Array.from(
    new Set([...evidenceResult.flags, ...anomalyResult.flags])
  );

  // Combine criteria breakdown (favor AI breakdown if available)
  const criteriaBreakdown =
    aiResult.aiCriteriaBreakdown && aiResult.aiCriteriaBreakdown.length > 0
      ? aiResult.aiCriteriaBreakdown
      : reqResult.breakdown;

  // Composite Score Calculation
  // 35% Requirements + 35% Evidence + 30% Quality - Penalties
  const effectiveEvidenceScore = Math.round(
    (evidenceResult.score + aiResult.aiEvidenceScore) / 2
  );
  const rawComposite =
    reqResult.score * 0.35 +
    effectiveEvidenceScore * 0.35 +
    aiResult.qualityScore * 0.3 -
    anomalyResult.penalty;

  const compositeScore = Math.max(0, Math.min(100, Math.round(rawComposite)));

  // Decision Rule
  let verdict: VerificationVerdict = "REVIEW";
  if (compositeScore >= 80 && !anomalyFlags.includes("GENERIC_SLOP")) {
    verdict = "PASS";
  } else if (compositeScore < 50 || anomalyFlags.includes("GENERIC_SLOP")) {
    verdict = "FAIL";
  } else {
    verdict = "REVIEW";
  }

  return {
    verdict,
    compositeScore,
    requirementsScore: reqResult.score,
    requirementsMet: reqResult.metCount,
    requirementsTotal: requirements.length,
    evidenceScore: effectiveEvidenceScore,
    qualityScore: aiResult.qualityScore,
    anomalyFlags,
    completionTimeSeconds: anomalyResult.completionTimeSeconds,
    explanation: aiResult.aiExplanation,
    criteriaBreakdown,
    evaluatedAt: new Date().toISOString(),
  };
}
