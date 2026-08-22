# Human API

> *"Software has APIs for machine capabilities. Human API is an API for human capabilities."*

Built for **Monad Blitz Hyderabad V3** · August 22, 2026

---

## 🌟 Overview

Human API is an on-chain escrow & real-time human micro-task marketplace on Monad Testnet. It connects applications and users needing rapid human actions (QA/app testing, code audits, UI feedback) with verified human providers.

- **Smart Contract Escrow**: Reentrancy-safe escrow locking MON rewards upon task creation and releasing payouts instantly upon approval.
- **Sub-Second Realtime**: Powered by Supabase Realtime (Postgres Logical Replication CDC over WebSocket).
- **Mobile QR Fast Join**: Instant mobile phone execution flow for crowd testing.
- **AI Task Classification**: OpenCode Zen classification with non-blocking graceful fallback.
- **On-Chain Reputation**: Tracks verified task completion counts and approval rates on Monad.

---

## ⛓️ Monad Testnet Deployment

- **Network**: Monad Testnet (Chain ID `10143` / `0x279f`)
- **RPC URL**: `https://testnet-rpc.monad.xyz/`
- **Explorer**: [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com)
- **Contract Address**: [`0xAecc9F6CDd4ceeD0b04588E026b7049f219d3779`](https://testnet.monadexplorer.com/address/0xAecc9F6CDd4ceeD0b04588E026b7049f219d3779)
- **Smart Contract Source**: [`contracts/src/HumanTaskEscrow.sol`](contracts/src/HumanTaskEscrow.sol)

---

## 🏗️ Architecture & Trust Model

```
┌──────────────┐         ┌───────────────────┐         ┌──────────────────┐
│   Browser     │────────▶│  Next.js API        │────────▶│  Supabase Postgres│
│  wagmi/viem/  │         │  routes (App        │         │  via Prisma ORM   │
│  RainbowKit   │         │  Router, TypeScript)│         │                   │
└──────┬───────┘         └───────────────────┘         └────────┬──────────┘
       │                                                          │ Realtime
       │ direct signed tx                                         │ (Postgres
       │ (connect, sign, send)                                    │  logical
       ▼                                                          │  replication
┌───────────────────┐                                            │  → WS push)
│  Monad Testnet      │                                            ▼
│  HumanTaskEscrow     │                                  ┌──────────────────┐
│  contract (Solidity) │                                  │  All subscribed   │
│                      │                                  │  clients: Available│
│  emits events ───────┼─────────────────────────────────▶│  Now grid, task    │
└───────────────────┘                                     │  detail pages,     │
                                                          │  QR join page      │
                                                          └──────────────────┘
```

### The 4-Phase Orchestration Loop
1. **(a) Optimistic DB write**: API records row with `PENDING_*` status for immediate UI response.
2. **(b) Chain write**: User wallet signs and sends transaction on Monad.
3. **(c) Confirmation wait**: Client awaits transaction receipt via Viem.
4. **(d) Reconciliation PATCH**: Server independently re-derives truth directly from Monad RPC logs/events, updates Postgres, and Supabase Realtime pushes live updates to all clients.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend & Backend** | Next.js 15/16 App Router, TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS v4 + modern dark-mode glassmorphic theme |
| **Realtime** | Supabase Realtime (CDC WebSocket) |
| **Database** | Supabase Postgres + Prisma ORM 5.x |
| **Blockchain** | Monad Testnet (Chain ID 10143) |
| **Smart Contracts** | Solidity `^0.8.24`, OpenZeppelin `ReentrancyGuard` & `Ownable` |
| **Tooling** | Foundry (`forge`, `cast`, `anvil`) |
| **Web3 Client** | Wagmi v2, Viem v2, RainbowKit |
| **AI Matching** | OpenCode Zen API (`classifyTask`) |

---

## 🚀 How to Run Locally (5 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Run Foundry smart contract tests
cd contracts && forge test -vvv && cd ..

# 3. Generate Prisma client
npx prisma generate

# 4. (Optional) Push schema to Postgres
# npx prisma db push

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📐 Considered Engineering Tradeoffs

To ensure production-grade robustness within the 6-hour sprint:
1. **Single-provider-per-task in Escrow**: Multi-slot escrow was factored into independent single-slot task instances at the application layer to minimize smart contract attack surface and eliminate complex partial-refund edge cases.
2. **Push Payments with Checks-Effects-Interactions**: Direct `.call{value: reward}("")` with strict CEI ordering and OpenZeppelin `ReentrancyGuard` eliminates the extra user withdrawal step while remaining mathematically immune to reentrancy.
3. **Optimistic Cache with RPC Re-verification**: Postgres never holds financial balances as source of truth; the server re-queries Monad RPC receipts on PATCH reconciliation to guarantee correctness.
4. **Resilient AI Degradation**: OpenCode Zen AI classification operates with a 5-second timeout and falls back seamlessly to manual category selection without interrupting user task creation.

---

## 📱 Acceptance Test Flow

1. **Create Task**: Requester deposits `0.05 MON` into escrow via `createTask()`.
2. **Accept Task**: Provider accepts on-chain via `acceptTask()`.
3. **Submit Result**: Provider submits QA findings via `submitResult()`.
4. **Approve & Payout**: Requester approves via `approveTask()`, releasing `0.05 MON` directly to provider.
5. **Reputation Update**: On-chain counters `tasksApproved` and `tasksAccepted` increment.
