import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import type { UserNFT } from "../types/nft";
import { getAlchemyApi } from "../services/alchemyApi";

interface UseUserNFTHistoryProps {
  contractAddress?: `0x${string}`; // Optional: filter by specific contract
  refreshKey?: number; // Optional: trigger refetch when this key changes
}

/**
 * Custom hook to fetch user's NFT ownership history from Alchemy API
 * @param contractAddress - Optional filter for specific contract
 */
export const useUserNFTHistory = ({
  contractAddress,
  refreshKey = 0,
}: UseUserNFTHistoryProps = {}) => {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchUserNFTs = async () => {
      // Skip if not connected or no address
      if (!isConnected || !address) {
        setNfts([]);
        setTotalCount(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const alchemyApi = getAlchemyApi();
        const { nfts, totalCount } = await alchemyApi.getNFTs({
          owner: address,
          contractAddress,
          pageSize: 100,
        });

        if (mounted) {
          setNfts(nfts);
          setTotalCount(totalCount);
        }
      } catch (err) {
        console.error("[UserNFTHistory] Error fetching NFTs:", err);
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch NFT history",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Fetch when address or connection changes
    fetchUserNFTs();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, [address, isConnected, contractAddress, refreshKey]);

  return { nfts, isLoading, error, totalCount };
};
