/**
 * WalletConnectButton Component - Claude Theme
 * Styled with warm Crail terracotta accents and Apple-grade precision
 */

"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Wallet } from "lucide-react";

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#C15F3C] hover:bg-[#A84F30] active:scale-[0.985] rounded-xl shadow-sm transition-all duration-150"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-medium text-[#C15F3C] bg-[#C15F3C]/10 border border-[#C15F3C]/30 rounded-xl hover:bg-[#C15F3C]/15 transition-colors"
                  >
                    Switch to Monad Testnet
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F4F3EE] dark:bg-[#242422] border border-[#E8E6DF] dark:border-[#3A3A36] rounded-xl text-[#1A1A18] dark:text-[#F4F3EE] hover:border-[#B1ADA1] transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32] dark:bg-[#4CAF50] animate-pulse" />
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-[#FFFFFF] dark:bg-[#1E1E1C] border border-[#E8E6DF] dark:border-[#3A3A36] rounded-xl text-[#1A1A18] dark:text-[#F4F3EE] hover:border-[#C15F3C]/50 transition-all shadow-xs"
                  >
                    <span className="font-mono text-xs font-semibold">{account.displayName}</span>
                    {account.displayBalance ? (
                      <span className="text-[#C15F3C] dark:text-[#D97757] font-medium">
                        {account.displayBalance}
                      </span>
                    ) : null}
                    <ChevronDown className="w-3.5 h-3.5 text-[#B1ADA1]" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
