// src/lib/wagmi.ts
import { http, createStorage, noopStorage, createConfig } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { monadTestnet } from "./chain";

export { monadTestnet };

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: [metaMaskWallet, injectedWallet],
    },
  ],
  {
    appName: "Human API",
    projectId: "00000000000000000000000000000000",
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz/"
    ),
  },
  ssr: true,
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
  }),
});