import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { NftMinter } from "@/components/nft/NftMinter";
import { NFTCreator } from "@/components/nft/NFTCreator";
import { NftGallery } from "@/components/nft/NftGallery";
import { RecentMints } from "@/components/nft/RecentMints";
import { TransactionHistory } from "@/components/transaction/TransactionHistory";
import { APP_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui";

function App() {
  const { isConnected } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);
  const [mintMode, setMintMode] = useState<"simple" | "creator">("simple");

  const githubUrl = APP_CONFIG.repository;
  const twitterUrl = APP_CONFIG.twitter;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-gray-900/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-bold text-white">
              NFT
            </div>
            <div>
              <h1 className="text-xl font-bold">{APP_CONFIG.name}</h1>
              <p className="text-xs text-gray-400">{APP_CONFIG.description}</p>
            </div>
          </div>
          <ConnectButton showBalance={false} chainStatus="full" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mint Your Unique NFT
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join our exclusive collection. Each NFT is unique and stored on the
            Ethereum blockchain with IPFS metadata.
          </p>
        </section>

        {/* Minting Section */}
        <section className="mb-12">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-linear-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl" />
            <div className="relative flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl px-6 py-4">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/40">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold bg-linear-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  Mint NFT
                </h3>
                <p className="text-sm text-gray-400">
                  Create your unique digital collectible
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          {isConnected && (
            <div className="flex gap-2 mb-6">
              <Button
                variant={mintMode === "simple" ? "primary" : "secondary"}
                onClick={() => setMintMode("simple")}
                className="flex-1"
              >
                Simple Mint
              </Button>
              <Button
                variant={mintMode === "creator" ? "primary" : "secondary"}
                onClick={() => setMintMode("creator")}
                className="flex-1"
              >
                NFT Creator (IPFS)
              </Button>
            </div>
          )}

          {isConnected ? (
            mintMode === "simple" ? (
              <NftMinter onMintSuccess={() => setRefreshKey((k) => k + 1)} />
            ) : (
              <NFTCreator onMintSuccess={() => setRefreshKey((k) => k + 1)} />
            )
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
              <p className="text-gray-400 mb-4">
                Connect your wallet to start minting
              </p>
            </div>
          )}
        </section>

        {/* Connected User Sections */}
        {isConnected && (
          <>
            {/* Recent Mints (Live) */}
            <section className="mb-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl" />
                <div className="relative flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-green-500/30 rounded-xl px-6 py-4">
                  <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/40">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold bg-linear-to-r from-green-300 via-emerald-300 to-green-300 bg-clip-text text-transparent">
                        Recent Mints
                      </h3>
                      <span className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/30">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Real-time community activity
                    </p>
                  </div>
                </div>
              </div>
              <RecentMints />
            </section>

            {/* User's NFT Gallery */}
            <section className="mb-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl" />
                <div className="relative flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl px-6 py-4">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/40">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-linear-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                      My NFTs
                    </h3>
                    <p className="text-sm text-gray-400">
                      Your personal collection
                    </p>
                  </div>
                </div>
              </div>
              <NftGallery refreshKey={refreshKey} />
            </section>

            {/* Transaction History */}
            <section className="mb-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl" />
                <div className="relative flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl px-6 py-4">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-linear-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                      Transaction History
                    </h3>
                    <p className="text-sm text-gray-400">
                      Track all your activities
                    </p>
                  </div>
                </div>
              </div>
              <TransactionHistory refreshKey={refreshKey} />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} {APP_CONFIG.name}. Built on Ethereum.
          </p>
          <p className="mt-2">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              GitHub
            </a>
            {" • "}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              X
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
