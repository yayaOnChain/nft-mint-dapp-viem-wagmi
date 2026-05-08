'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NftMinter } from '@/components/nft/NftMinter';
import { NftGallery } from '@/components/nft/NftGallery';
import { TransactionHistory } from '@/components/transaction/TransactionHistory';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            MyProjectNFT
          </h1>
          <ConnectButton />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Mint NFT</h2>
            <NftMinter />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Your Collection</h2>
            <NftGallery />
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Transaction History</h2>
          <TransactionHistory />
        </section>
      </div>
    </main>
  );
}