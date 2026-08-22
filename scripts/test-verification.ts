// scripts/test-verification.ts
import { verifySubmission } from "../src/lib/verification";
import type { Task } from "../src/types/task";

async function runTests() {
  console.log("==================================================");
  console.log("  Testing 4-Layer Task Verification Engine");
  console.log("==================================================\n");

  const sampleTask: Task = {
    id: "test_task_1",
    onChainId: "1",
    title: "Test user onboarding flow on iOS / Android",
    description:
      "Please test creating a new account, complete the onboarding walkthrough, and report any bugs or UI friction points with severity level.",
    category: "Testing",
    skills: ["App Testing", "QA", "Mobile", "UI/UX"],
    requirements: [
      "Test registration flow on mobile device",
      "Report UI friction or layout bugs with severity level",
      "Provide screenshot proof link of final screen",
    ],
    rewardWei: "20000000000000000",
    estimatedMinutes: 10,
    status: "OPEN",
    requesterAddress: "0xf1d0e196fdf6309d335f69d5251ff91d399fcbb3",
    providerAddress: null,
    resultText: null,
    resultSeverity: null,
    resultAttachmentUrl: null,
    createTxHash: null,
    acceptTxHash: null,
    submitTxHash: null,
    approveTxHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Test Case 1: Valid & High-Quality Submission
  console.log("--- TEST CASE 1: Valid & High-Quality Submission ---");
  const validSubmission = {
    resultText:
      "Completed registration flow on iOS 17.5. Found 1 minor visual alignment issue on the seed phrase confirmation screen where the Next button overlaps the bottom bezel. Overall onboarding was smooth.",
    resultSeverity: "Low" as const,
    resultAttachmentUrl: "https://imgur.com/a/sample-test-proof",
    acceptedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
    submittedAt: new Date().toISOString(),
  };

  const scorecard1 = await verifySubmission(sampleTask, validSubmission);
  console.log("Verdict:", scorecard1.verdict);
  console.log("Composite Score:", scorecard1.compositeScore);
  console.log("Requirements Met:", `${scorecard1.requirementsMet}/${scorecard1.requirementsTotal}`);
  console.log("Evidence Score:", scorecard1.evidenceScore);
  console.log("Quality Score:", scorecard1.qualityScore);
  console.log("Anomaly Flags:", scorecard1.anomalyFlags);
  console.log("Explanation:", scorecard1.explanation);
  console.log("Passed Requirement Check?:", scorecard1.verdict === "PASS" ? "✅ PASS" : "❌ FAILED");
  console.log("\n");

  // Test Case 2: Speed Anomaly (Completed in 4 seconds for a 10 min task)
  console.log("--- TEST CASE 2: Speed Anomaly Detection ---");
  const speedAnomalySubmission = {
    resultText: "Registration tested and verified working properly on mobile device.",
    resultSeverity: "Low" as const,
    resultAttachmentUrl: "https://example.com/proof.png",
    acceptedAt: new Date(Date.now() - 4 * 1000).toISOString(), // 4 seconds ago
    submittedAt: new Date().toISOString(),
  };

  const scorecard2 = await verifySubmission(sampleTask, speedAnomalySubmission);
  console.log("Verdict:", scorecard2.verdict);
  console.log("Composite Score:", scorecard2.compositeScore);
  console.log("Anomaly Flags:", scorecard2.anomalyFlags);
  console.log("Speed Anomaly Flagged?:", scorecard2.anomalyFlags.includes("SPEED_ANOMALY") ? "✅ YES (Flagged)" : "❌ NO");
  console.log("\n");

  // Test Case 3: Generic Slop ("done")
  console.log("--- TEST CASE 3: Generic Slop / Fraud Detection ---");
  const slopSubmission = {
    resultText: "done",
    resultSeverity: null,
    resultAttachmentUrl: null,
    acceptedAt: new Date(Date.now() - 10 * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
  };

  const scorecard3 = await verifySubmission(sampleTask, slopSubmission);
  console.log("Verdict:", scorecard3.verdict);
  console.log("Composite Score:", scorecard3.compositeScore);
  console.log("Anomaly Flags:", scorecard3.anomalyFlags);
  console.log("Slop Flagged as FAIL?:", scorecard3.verdict === "FAIL" ? "✅ YES (FAIL)" : "❌ NO");
  console.log("\n==================================================");
}

runTests().catch(console.error);
