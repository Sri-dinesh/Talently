/**
 * WalletConnectButton Component
 * Wraps RainbowKit's ConnectButton with custom responsive styling
 */

"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

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
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-semibold text-red-200 bg-red-950/80 border border-red-800 rounded-xl hover:bg-red-900 transition-colors"
                  >
                    Wrong Network (Switch to Monad)
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900/80 border border-purple-900/40 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-purple-950/60 border border-purple-800/50 rounded-xl text-purple-200 hover:bg-purple-900/60 transition-colors"
                  >
                    <span>{account.displayName}</span>
                    {account.displayBalance ? (
                      <span className="text-purple-400 font-normal">
                        ({account.displayBalance})
                      </span>
                    ) : null}
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
