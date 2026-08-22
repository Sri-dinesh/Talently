// src/lib/contract.ts
import {
  getContract,
  type Address,
  type Abi,
  createPublicClient,
  http,
  type WalletClient,
  type PublicClient,
} from "viem";
import abi from "./HumanTaskEscrow.abi.json";
import { monadTestnet } from "./chain";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x3aB8749cD941F48C8b5773172E9D840888BEb1Fe") as Address;

export const HUMAN_TASK_ESCROW_ABI = abi as Abi;

/**
 * Read-only contract instance — use in server components / API routes
 * via a plain viem publicClient.
 */
export function getReadContract(publicClient?: PublicClient) {
  const client =
    publicClient ||
    createPublicClient({
      chain: monadTestnet,
      transport: http(
        process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz/"
      ),
    });

  return getContract({
    address: CONTRACT_ADDRESS,
    abi: HUMAN_TASK_ESCROW_ABI,
    client,
  });
}

/**
 * Write-capable contract instance for client components with a connected wallet.
 */
export function getWriteContract(walletClient: WalletClient) {
  return getContract({
    address: CONTRACT_ADDRESS,
    abi: HUMAN_TASK_ESCROW_ABI,
    client: walletClient,
  });
}
