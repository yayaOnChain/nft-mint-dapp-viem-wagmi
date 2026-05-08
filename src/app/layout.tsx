import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'NFT Mint DApp',
  description: 'Mint your NFTs on Ethereum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}