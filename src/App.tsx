import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { NftMinter } from "./components/nft/NftMinter";
import { NftGallery } from "./components/nft/NftGallery";
import { RecentMints } from "./components/nft/RecentMints";
import { TransactionHistory } from "./components/transaction/TransactionHistory";
import { APP_CONFIG } from "./lib/constants";

function App() {
  const { isConnected } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);

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
            Ethereum blockchain.
          </p>
        </section>

        {/* Minting Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-purple-600 rounded-full" />
            <h3 className="text-2xl font-bold">Mint NFT</h3>
          </div>
          {isConnected ? (
            <NftMinter onMintSuccess={() => setRefreshKey((k) => k + 1)} />
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-green-600 rounded-full" />
                <h3 className="text-2xl font-bold">Recent Mints</h3>
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <RecentMints />
            </section>

            {/* User's NFT Gallery */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-purple-600 rounded-full" />
                <h3 className="text-2xl font-bold">My NFTs</h3>
              </div>
              <NftGallery refreshKey={refreshKey} />
            </section>

            {/* Transaction History */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-blue-600 rounded-full" />
                <h3 className="text-2xl font-bold">Transaction History</h3>
              </div>
              <TransactionHistory />
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
            <a href="#" className="hover:text-purple-400 transition-colors">
              Documentation
            </a>
            {" • "}
            <a href="#" className="hover:text-purple-400 transition-colors">
              GitHub
            </a>
            {" • "}
            <a href="#" className="hover:text-purple-400 transition-colors">
              Discord
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
