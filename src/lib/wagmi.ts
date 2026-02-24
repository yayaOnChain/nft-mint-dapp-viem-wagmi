import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

// Ensure you have VITE_WALLET_CONNECT_PROJECT_ID in your .env file
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Missing VITE_WALLET_CONNECT_PROJECT_ID environment variable",
  );
}

// Create Wagmi config with RainbowKit default setup
// This automatically includes WalletConnect, Injected (MetaMask), and Coinbase connectors
export const config = getDefaultConfig({
  appName: "My NFT Minting DApp",
  projectId: projectId,
  chains: [mainnet, sepolia],
  ssr: false, // Set to true if you are using Next.js, false for Vite/CRA
});
