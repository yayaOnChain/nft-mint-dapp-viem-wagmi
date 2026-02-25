import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";

interface UsePollingEventsProps {
  contractAddress: `0x${string}`;
  pollInterval?: number; // in milliseconds
  maxRange?: number; // Max blocks per request (default: 10 for Alchemy free tier)
}

export const useNftMintedEventsPolling = ({
  contractAddress,
  pollInterval = 15000,
  maxRange = 10, // Critical: Limits for Alchemy Free Tier
}: UsePollingEventsProps) => {
  const [recentMints, setRecentMints] = useState<Array<any>>([]);
  const [lastBlock, setLastBlock] = useState<bigint | undefined>();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch events from a specific block range safely
   */
  const fetchEventsInRange = async (fromBlock: bigint, toBlock: bigint) => {
    if (!publicClient) return [];

    try {
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event NFTMinted(address indexed minter, uint256 indexed tokenId)",
        ),
        args: {},
        fromBlock,
        toBlock,
      });

      return logs;
    } catch (err) {
      console.error("[Polling Range Error]:", err);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const processMint = (logs: any[]) => {
      if (logs.length === 0) return;

      const newMints = logs.map((log) => ({
        minter: log.args.minter,
        tokenId: log.args.tokenId,
        timestamp: Date.now(),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }));

      // Update state with deduplication and limit to last 10
      setRecentMints((prev) => {
        // Add new mints to front
        const combined = [...newMints, ...prev];

        // Remove duplicates based on token ID (since we're tracking by ID)
        const uniqueMints = Array.from(
          new Map(
            combined.map((item) => [item.tokenId.toString(), item]),
          ).values(),
        );

        // Keep only last 10
        return uniqueMints.slice(0, 10);
      });
    };

    const fetchEvents = async () => {
      if (!mounted || !publicClient) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get current latest block
        const currentBlock = await publicClient.getBlockNumber();

        // Set initial lastBlock or use it for calculation
        const previousBlock = lastBlock || currentBlock;

        // Calculate how many blocks need to be checked
        const blocksToCheck = Number(currentBlock) - Number(previousBlock);

        let processedBlocks = 0n;
        let accumulatedLogs: any[] = [];

        // Split into chunks of maxRange (e.g., 10 blocks)
        while (processedBlocks < BigInt(blocksToCheck)) {
          const remaining = blocksToCheck - Number(processedBlocks);
          const currentRange = Math.min(maxRange, remaining);

          const fromBlockNum = previousBlock + processedBlocks + 1n;
          const toBlockNum = fromBlockNum + BigInt(currentRange) - 1n;

          // Safe check to not go negative
          if (fromBlockNum > currentBlock) break;

          const rangeLogs = await fetchEventsInRange(fromBlockNum, toBlockNum);
          accumulatedLogs.push(...rangeLogs);

          processedBlocks += BigInt(currentRange);

          // Small delay between requests to respect rate limits
          if (processedBlocks < BigInt(blocksToCheck)) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (accumulatedLogs.length > 0) {
          processMint(accumulatedLogs);
        }

        // Update lastBlock for next poll cycle
        if (mounted) setLastBlock(currentBlock);
      } catch (err) {
        console.error("[Polling Main Error]:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchEvents();

    // Setup polling interval
    if (pollInterval > 0) {
      timeoutId = setInterval(fetchEvents, pollInterval);
    }

    // Cleanup function
    return () => {
      mounted = false;
      if (timeoutId) clearInterval(timeoutId);
    };
  }, [contractAddress, pollInterval, publicClient, lastBlock, maxRange]);

  return { recentMints, isLoading, error };
};
