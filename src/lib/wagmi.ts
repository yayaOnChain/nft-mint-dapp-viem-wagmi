import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet } from "wagmi/chains";

// Configure wagmi client with chains and metadata
export const config = getDefaultConfig({
  appName: "MyProjectNFT Mint",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID, // Get from cloud.walletconnect.com
  chains: [
    mainnet,
    sepolia, // Testnet for development
  ],
  ssr: false, // Enable if using Next.js
});
