// src/lib/wagmi.ts
import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "./chain";

export { monadTestnet };

export const wagmiConfig = getDefaultConfig({
  appName: "Human API",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "3a8170812b534d0ff9d794f168fa75e8",
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz/"
    ),
  },
  ssr: true,
});
