import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, webSocket } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { walletConnectProjectId, useWebSocket, alchemyWsUrl } from "@/config/env";

/**
 * Wagmi configuration with WebSocket support for real-time events
 */
export const config = getDefaultConfig({
  appName: "MyProjectNFT",
  projectId: walletConnectProjectId,
  chains: [mainnet, sepolia],
  ssr: true,

  // Configure transports based on environment
  transports: {
    [mainnet.id]:
      useWebSocket && alchemyWsUrl ? webSocket(alchemyWsUrl) : http(),
    [sepolia.id]:
      useWebSocket && alchemyWsUrl
        ? webSocket(alchemyWsUrl.replace("mainnet", "sepolia"))
        : http(),
  },
});

// Export chain info for convenience
export const supportedChains = [mainnet, sepolia];
export const defaultChain = sepolia; // Change to mainnet for production
