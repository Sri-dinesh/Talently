/**
 * Root Layout for Human API
 * Wraps application with Wagmi, RainbowKit, and React Query Providers
 */

import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import Link from "next/link";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { Zap, PlusCircle, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Human API | On-Chain Micro-Task Marketplace on Monad",
  description: "Software has APIs for machine capabilities. Human API is an API for human capabilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070913] text-slate-100 min-h-screen flex flex-col selection:bg-purple-600/40">
        <Providers>
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070913]/80 border-b border-purple-900/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                    Human API
                  </span>
                  <span className="ml-1.5 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Monad
                  </span>
                </div>
              </Link>

              <nav className="flex items-center gap-4">
                <Link
                  href="/tasks"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <Compass className="w-4 h-4 text-purple-400" />
                  Explore Tasks
                </Link>
                <Link
                  href="/tasks/new"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  Post Task
                </Link>
                <WalletConnectButton />
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="border-t border-slate-800/60 bg-[#05070e] py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>Human API — Monad Blitz Hyderabad V3 · Real-time Human Micro-task Marketplace</p>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Monad Testnet (Chain ID 10143)</span>
                <span>•</span>
                <span>Escrow Verified On-Chain</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
