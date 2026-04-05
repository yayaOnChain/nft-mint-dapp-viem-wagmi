import { useWatchContractEvent } from "wagmi";
import { myNftAbi } from "@/abi/myNft";
import { useState, useEffect, useRef } from "react";

// Define TypeScript interface for the NFTMinted event parameters
export interface NFTMintedEvent {
  minter: `0x${string}`;
  tokenId: bigint;
}

interface UseNftMintedEventsProps {
  contractAddress: `0x${string}`;
  onNewMint?: (
    event: NFTMintedEvent & { blockNumber: bigint; txHash: `0x${string}` },
  ) => void;
}

/**
 * Custom hook to listen for NFTMinted events in real-time.
 * Falls back to polling for RPC providers that don't support WebSocket filters.
 */
export const useNftMintedEvents = ({
  contractAddress,
  onNewMint,
}: UseNftMintedEventsProps) => {
  const [recentMints, setRecentMints] = useState<
    Array<NFTMintedEvent & { timestamp: number }>
  >([]);
  const errorCountRef = useRef(0);
  const maxErrors = 3; // Disable after 3 consecutive errors

  // Watch for NFTMinted events using Wagmi's built-in hook
  useWatchContractEvent({
    address: contractAddress,
    abi: myNftAbi,
    eventName: "NFTMinted",
    poll: true, // Force polling mode for HTTP-only RPCs
    pollingInterval: 4_000, // Poll every 4 seconds
    // Optional: Only listen to events from specific block (for pagination)
    // fromBlock: 12345678n,
    onLogs: (logs) => {
      // Reset error count on successful event reception
      errorCountRef.current = 0;

      // Process each log entry
      logs.forEach((log) => {
        // Type-safe access to event arguments via log.args
        if (log.args.minter && log.args.tokenId !== undefined) {
          const newMint: NFTMintedEvent & {
            timestamp: number;
            txHash: `0x${string}`;
          } = {
            minter: log.args.minter,
            tokenId: log.args.tokenId,
            timestamp: Date.now(),
            txHash: log.transactionHash,
          };

          // Update local state with new mint
          setRecentMints((prev) => [newMint, ...prev.slice(0, 9)]); // Keep last 10

          // Trigger optional callback for parent components
          if (onNewMint) {
            onNewMint({
              ...newMint,
              blockNumber: log.blockNumber || 0n,
            });
          }
        }
      });
    },
    onError: (error) => {
      // Silently ignore "filter not found" errors from public RPCs
      if (error.message?.includes("filter not found")) {
        // Expected behavior for HTTP-only RPCs - polling will handle it
        return;
      }

      errorCountRef.current += 1;

      // Only log after maxErrors to avoid console spam
      if (errorCountRef.current <= maxErrors) {
        console.warn(
          `[useNftMintedEvents] Event subscription error (${errorCountRef.current}/${maxErrors}). Switching to polling mode.`,
        );
      }

      // After max consecutive errors, disable further error logging
      if (errorCountRef.current > maxErrors) {
        return;
      }
    },
  });

  // Cleanup: Clear recent mints when contract address changes
  useEffect(() => {
    setRecentMints([]);
  }, [contractAddress]);

  return { recentMints };
};
