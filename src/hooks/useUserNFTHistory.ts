import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import type { UserNFT } from "@/types/nft";
import { getAlchemyApi } from "@/services/alchemyApi";

const INITIAL_PAGE_SIZE = 10;
const LOAD_MORE_PAGE_SIZE = 10;

interface UseUserNFTHistoryProps {
  contractAddress?: `0x${string}`; // Optional: filter by specific contract
  refreshKey?: number; // Optional: trigger refetch when this key changes
}

interface UseUserNFTHistoryReturn {
  nfts: UserNFT[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Custom hook to fetch user's NFT ownership history from Alchemy API with pagination
 * @param contractAddress - Optional filter for specific contract
 */
export const useUserNFTHistory = ({
  contractAddress,
  refreshKey = 0,
}: UseUserNFTHistoryProps = {}): UseUserNFTHistoryReturn => {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageKey, setPageKey] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const fetchNFTs = useCallback(
    async (append: boolean = false) => {
      // Skip if not connected or no address
      if (!isConnected || !address) {
        setNfts([]);
        setTotalCount(0);
        setHasMore(false);
        setPageKey(undefined);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const alchemyApi = getAlchemyApi();
        const pageSize = append ? LOAD_MORE_PAGE_SIZE : INITIAL_PAGE_SIZE;

        const {
          nfts: fetchedNfts,
          totalCount,
          pageKey: newPageKey,
        } = await alchemyApi.getNFTs({
          owner: address,
          contractAddress,
          pageSize,
          pageKey: append ? pageKey : undefined,
        });

        if (append) {
          setNfts((prev) => [...prev, ...fetchedNfts]);
        } else {
          setNfts(fetchedNfts);
        }

        setTotalCount(totalCount);
        setPageKey(newPageKey);
        setHasMore(!!newPageKey);
      } catch (err) {
        console.error("[UserNFTHistory] Error fetching NFTs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch NFT history",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, contractAddress, pageKey],
  );

  // Initial fetch when component mounts or wallet changes
  useEffect(() => {
    fetchNFTs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, contractAddress, refreshKey]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchNFTs(true);
  }, [hasMore, isLoading, fetchNFTs]);

  return { nfts, isLoading, error, totalCount, hasMore, loadMore };
};
