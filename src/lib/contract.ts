// src/lib/contract.ts
import {
  getContract,
  type Address,
  type Abi,
  createPublicClient,
  http,
  type WalletClient,
  type PublicClient,
  getAddress,
} from "viem";
import abi from "./HumanTaskEscrow.abi.json";
import { monadTestnet } from "./chain";

const rawAddress =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Safely normalize to exact EIP-55 checksum address
export const CONTRACT_ADDRESS: Address = getAddress(rawAddress.toLowerCase());

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
