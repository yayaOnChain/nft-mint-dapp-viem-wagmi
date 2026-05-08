import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { walletConnectProjectId, useWebSocket } from "@/config/env";

/**
 * Wagmi configuration for Next.js
 */
export const config = getDefaultConfig({
  appName: "MyProjectNFT",
  projectId: walletConnectProjectId,
  chains: [mainnet, sepolia],
  ssr: true,

  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Export chain info for convenience
export const supportedChains = [mainnet, sepolia];
export const defaultChain = sepolia;
