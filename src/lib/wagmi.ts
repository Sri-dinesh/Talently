// src/lib/wagmi.ts
import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "./chain";

export { monadTestnet };

export const wagmiConfig = getDefaultConfig({
  appName: "Human API",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c0a5e82b79a14d5e89a2b4c5d6e7f809",
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz/"
    ),
  },
  ssr: true,
});
