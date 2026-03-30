import { useWatchContractEvent } from "wagmi";
import { myNftAbi } from "@/abi/myNft";
import { useState, useEffect } from "react";

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
 * Custom hook to listen for NFTMinted events in real-time
 * @param contractAddress - The deployed contract address
 * @param onNewMint - Optional callback when a new mint event is detected
 */
export const useNftMintedEvents = ({
  contractAddress,
  onNewMint,
}: UseNftMintedEventsProps) => {
  const [recentMints, setRecentMints] = useState<
    Array<NFTMintedEvent & { timestamp: number }>
  >([]);

  // Watch for NFTMinted events using Wagmi's built-in hook
  useWatchContractEvent({
    address: contractAddress,
    abi: myNftAbi,
    eventName: "NFTMinted",
    // Optional: Only listen to events from specific block (for pagination)
    // fromBlock: 12345678n,
    onLogs: (logs) => {
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
      // Handle subscription errors (e.g., WebSocket disconnect)
      console.error("Event listener error:", error);
    },
  });

  // Cleanup: Clear recent mints when contract address changes
  useEffect(() => {
    setRecentMints([]);
  }, [contractAddress]);

  return { recentMints };
};
