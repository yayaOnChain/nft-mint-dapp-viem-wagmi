import { useNftMintedEvents } from "./useNftMintedEvents"; // WebSocket version
import { useNftMintedEventsPolling } from "./useNftMintedEventsPolling"; // Polling version

interface UseNftMintedEventsUnifiedProps {
  contractAddress: `0x${string}`;
  onNewMint?: (event: any) => void;
}

/**
 * Unified hook that automatically chooses between WebSocket (prod)
 * and polling (dev) based on environment configuration.
 */
export const useNftMintedEventsUnified = ({
  contractAddress,
  onNewMint,
}: UseNftMintedEventsUnifiedProps) => {
  // Check if WebSocket endpoint is configured (via env variable)
  const hasWebSocket =
    import.meta.env.VITE_USE_WEBSOCKETS === "true" ||
    !!import.meta.env.VITE_ALCHEMY_WS_SEPOLIA;

  if (hasWebSocket) {
    // Production: Use real-time WebSocket subscription
    return useNftMintedEvents({ contractAddress, onNewMint });
  } else {
    // Development: Use polling fallback with 60s interval
    return useNftMintedEventsPolling({
      contractAddress,
      pollInterval: 60000, // 60 seconds
    });
  }
};
