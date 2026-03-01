import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import type { UserNFT, AlchemyNFTResponse } from "../types/nft";

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

  const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  const alchemyNetwork = import.meta.env.VITE_ALCHEMY_NETWORK || "eth-sepolia";

  useEffect(() => {
    let mounted = true;

    const fetchUserNFTs = async () => {
      // Skip if not connected or no address
      if (!isConnected || !address || !alchemyApiKey) {
        setNfts([]);
        setTotalCount(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Build Alchemy NFT API URL
        const baseUrl = `https://${alchemyNetwork}.g.alchemy.com/nft/v2/${alchemyApiKey}/getNFTs`;

        // Build query parameters
        const params = new URLSearchParams({
          owner: address,
          pageSize: "100", // Max per page
        });

        // Optional: Filter by contract address
        if (contractAddress) {
          params.append("contractAddresses[]", contractAddress);
        }

        const response = await fetch(`${baseUrl}?${params}`);

        if (!response.ok) {
          throw new Error(`Alchemy API error: ${response.status}`);
        }

        const data: AlchemyNFTResponse = await response.json();

        if (mounted) {
          // Transform Alchemy response to our UserNFT type
          const userNFTs: UserNFT[] = data.ownedNfts.map((nft) => ({
            tokenId: nft.id.tokenId,
            contractAddress: nft.contract.address as `0x${string}`,
            tokenUri: nft.tokenUri?.gateway,
            mintedAt: Date.now(), // Note: Alchemy doesn't provide mint timestamp directly
          }));

          setNfts(userNFTs);
          setTotalCount(data.totalCount);
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
  }, [
    address,
    isConnected,
    contractAddress,
    alchemyApiKey,
    alchemyNetwork,
    refreshKey,
  ]);

  return { nfts, isLoading, error, totalCount };
};
