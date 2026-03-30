import { useNftMintedEvents } from "@/hooks/useNftMintedEvents"; // WebSocket version
import { useNftMintedEventsPolling } from "@/hooks/useNftMintedEventsPolling"; // Polling version
import type { NFTMintedEvent } from "@/hooks/useNftMintedEvents";

interface UseNftMintedEventsUnifiedProps {
  contractAddress: `0x${string}`;
  onNewMint?: (
    event: NFTMintedEvent & { blockNumber: bigint; txHash: `0x${string}` },
  ) => void;
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

  // Use both hooks and return the appropriate one based on environment
  // This ensures hooks are called in the same order on every render
  const webSocketResult = useNftMintedEvents({ contractAddress, onNewMint });
  const pollingResult = useNftMintedEventsPolling({
    contractAddress,
    pollInterval: 60000, // 60 seconds
  });

  // Return the appropriate result based on WebSocket availability
  if (hasWebSocket) {
    // Production: Use real-time WebSocket subscription
    return webSocketResult;
  } else {
    // Development: Use polling fallback with 60s interval
    return pollingResult;
  }
};
