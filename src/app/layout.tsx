/**
 * Root Layout for Human API - Claude Brand Palette
 * Crafted with Crail (#C15F3C), Pampas (#F4F3EE), Cloudy (#B1ADA1), and Pure White (#FFFFFF)
 */

import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import Link from "next/link";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { Compass, PlusCircle, Sparkles, Users, Flame } from "lucide-react";

export const metadata: Metadata = {
  metadataBase: new URL("https://talentlyoffi.vercel.app"),
  title: "Talently · On-Chain Human Capability & Intelligence Protocol on Monad",
  description: "Talently connects machine protocols, AI agents, and decentralized applications to real-time human intelligence, swarms, and social coordination on Monad.",
  openGraph: {
    title: "Talently · On-Chain Human Capability & Intelligence Protocol on Monad",
    description: "Connect machine protocols and autonomous AI agents to real-time human capability, swarm intelligence, and social coordination on Monad.",
    url: "https://talentlyoffi.vercel.app",
    siteName: "Talently",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Talently · On-Chain Human Capability Protocol on Monad",
    description: "Decentralized execution layer connecting AI agents to human swarms on Monad.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#FBFBF9] dark:bg-[#141413] text-[#1A1A18] dark:text-[#F4F3EE] min-h-screen flex flex-col selection:bg-[#C15F3C]/20 selection:text-[#C15F3C]">
        <Providers>
          {/* Header */}
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FBFBF9]/85 dark:bg-[#141413]/85 border-b border-[#E8E6DF] dark:border-[#2C2C29] transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-[#C15F3C] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <span className="font-serif font-bold text-white text-base">T</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base tracking-tight text-[#1A1A18] dark:text-[#F4F3EE]">
                    Talently
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4F3EE] dark:bg-[#242422] text-[#6B665E] dark:text-[#B1ADA1] border border-[#E8E6DF] dark:border-[#3A3A36]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C15F3C] animate-pulse" />
                    Monad
                  </span>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/tasks"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6B665E] dark:text-[#B1ADA1] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] px-3 py-1.5 rounded-lg hover:bg-[#F4F3EE] dark:hover:bg-[#1E1E1C] transition-all"
                >
                  <Compass className="w-4 h-4 text-[#C15F3C]" />
                  <span>Explore</span>
                </Link>
                <Link
                  href="/tasks/new"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6B665E] dark:text-[#B1ADA1] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] px-3 py-1.5 rounded-lg hover:bg-[#F4F3EE] dark:hover:bg-[#1E1E1C] transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-[#C15F3C]" />
                  <span>Post Task</span>
                </Link>
                <Link
                  href="/swarm"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6B665E] dark:text-[#B1ADA1] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] px-3 py-1.5 rounded-lg hover:bg-[#F4F3EE] dark:hover:bg-[#1E1E1C] transition-all"
                >
                  <Users className="w-4 h-4 text-[#C15F3C]" />
                  <span>Swarm</span>
                </Link>
                <Link
                  href="/spin"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6B665E] dark:text-[#B1ADA1] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] px-3 py-1.5 rounded-lg hover:bg-[#F4F3EE] dark:hover:bg-[#1E1E1C] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#836EF9]" />
                  <span className="hidden sm:inline">Roulette</span>
                  <span className="sm:hidden">Spin</span>
                </Link>
                <Link
                  href="/floor"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6B665E] dark:text-[#B1ADA1] hover:text-[#1A1A18] dark:hover:text-[#F4F3EE] px-3 py-1.5 rounded-lg hover:bg-[#F4F3EE] dark:hover:bg-[#1E1E1C] transition-all"
                >
                  <Flame className="w-4 h-4 text-[#C15F3C] animate-pulse" />
                  <span className="hidden sm:inline">The Floor</span>
                  <span className="sm:hidden">Floor</span>
                  <span className="hidden lg:inline-flex text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#C15F3C]/20 text-[#C15F3C] border border-[#C15F3C]/30 ml-0.5">
                    NEW
                  </span>
                </Link>
                <div className="pl-2 border-l border-[#E8E6DF] dark:border-[#2C2C29]">
                  <WalletConnectButton />
                </div>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {children}
          </main>

          {/* Minimalist Footer */}
          <footer className="border-t border-[#E8E6DF] dark:border-[#2C2C29] bg-[#FBFBF9] dark:bg-[#141413] py-8 text-xs text-[#8A857B] dark:text-[#7D7970] transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#C15F3C]/10 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-[#C15F3C]" />
                </div>
                <p>Talently · Real-Time Human Capability Protocol on Monad</p>
              </div>
              <div className="flex items-center gap-3">
                <span>Monad Testnet (10143)</span>
                <span>•</span>
                <span className="text-[#2E7D32] dark:text-[#4CAF50] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                  Escrow Verified
                </span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
