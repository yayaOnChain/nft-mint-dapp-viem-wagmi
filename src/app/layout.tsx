import type { Metadata } from 'next';
import { AppProviders } from './providers/AppProviders';
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-900 text-white" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}