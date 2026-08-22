// src/types/roulette.ts
// Shared WheelSegment interface and default wheel segments definition

export interface WheelSegment {
  id: number;
  label: string;
  category: string;
  rewardMon: string;
  rewardWei: string;
  estimatedMinutes: number;
  color: string;
  accent: string;
  iconName: string;
  badge: string;
  sampleTitle: string;
  sampleDescription: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: 0,
    label: "DEX Bug Hunt",
    category: "Testing",
    rewardMon: "0.020",
    rewardWei: "20000000000000000",
    estimatedMinutes: 8,
    color: "#C15F3C",
    accent: "#E07A5F",
    iconName: "zap",
    badge: "2× Popular",
    sampleTitle: "Test Monad DEX swap flow & slippage on mobile",
    sampleDescription: "Execute a test swap on Monad Testnet with custom slippage and report transaction latency and UI responsiveness.",
  },
  {
    id: 1,
    label: "Speedrun Audit",
    category: "Design",
    rewardMon: "0.015",
    rewardWei: "15000000000000000",
    estimatedMinutes: 5,
    color: "#836EF9",
    accent: "#9D8CFC",
    iconName: "clock",
    badge: "Speedrun",
    sampleTitle: "First impression review for DeFi staking dashboard",
    sampleDescription: "Review hero section, APR calculators, and mobile tap targets. Provide 3 actionable UX friction notes.",
  },
  {
    id: 2,
    label: "Invariant Check",
    category: "Technical",
    rewardMon: "0.040",
    rewardWei: "40000000000000000",
    estimatedMinutes: 15,
    color: "#2E7D32",
    accent: "#4CAF50",
    iconName: "search",
    badge: "Security",
    sampleTitle: "Review escrow withdrawal logic for reentrancy vectors",
    sampleDescription: "Inspect escrow contract checks-effects-interactions and verify reentrancy protection on the payout function.",
  },
  {
    id: 3,
    label: "Swarm Slot",
    category: "Swarm",
    rewardMon: "0.025",
    rewardWei: "25000000000000000",
    estimatedMinutes: 10,
    color: "#D97757",
    accent: "#F4A261",
    iconName: "users",
    badge: "Swarm AI",
    sampleTitle: "Parallel browser compatibility audit across 5 workers",
    sampleDescription: "Test the onboarding flow across your specific browser & OS to contribute to the Swarm Intelligence consensus report.",
  },
  {
    id: 4,
    label: "2× Multiplier",
    category: "Testing",
    rewardMon: "0.050",
    rewardWei: "50000000000000000",
    estimatedMinutes: 12,
    color: "#F59E0B",
    accent: "#FBBF24",
    iconName: "sparkles",
    badge: "2× Multiplier",
    sampleTitle: "End-to-end checkout & payment edge-case stress test",
    sampleDescription: "Attempt payment with expired tokens, wrong network, and low gas to test error modal handling on Monad.",
  },
  {
    id: 5,
    label: "UX Friction Sprint",
    category: "Design",
    rewardMon: "0.010",
    rewardWei: "10000000000000000",
    estimatedMinutes: 5,
    color: "#EC4899",
    accent: "#F472B6",
    iconName: "palette",
    badge: "Fast MON",
    sampleTitle: "Color contrast & typography audit for dark mode",
    sampleDescription: "Inspect all primary buttons, badges, and card text in dark mode for WCAG AA compliance and readability.",
  },
  {
    id: 6,
    label: "RPC Benchmark",
    category: "Technical",
    rewardMon: "0.018",
    rewardWei: "18000000000000000",
    estimatedMinutes: 5,
    color: "#06B6D4",
    accent: "#22D3EE",
    iconName: "server",
    badge: "Infra",
    sampleTitle: "Geographic latency & block header ping on Monad RPCs",
    sampleDescription: "Send 10 batch eth_getBlockByNumber requests from your ISP region and record round-trip ping time.",
  },
  {
    id: 7,
    label: "Grand Jackpot",
    category: "High Priority",
    rewardMon: "0.080",
    rewardWei: "80000000000000000",
    estimatedMinutes: 20,
    color: "#EAB308",
    accent: "#FACC15",
    iconName: "trophy",
    badge: "Grand Jackpot",
    sampleTitle: "Full smart contract invariant test suite & bug reproduction",
    sampleDescription: "Deep dive audit into state transition invariants and access control permissions. Highest reward bounty pool.",
  },
];
