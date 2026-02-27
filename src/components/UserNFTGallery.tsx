import { useEffect, useState } from "react";
import { useUserNFTHistory } from "../hooks/useUserNFTHistory";
import { NFTCardSkeleton } from "./ui/Skeleton";
import type { UserNFT } from "../types/nft";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

/**
 * Display user's owned NFTs in a gallery format
 */
export const UserNFTGallery = () => {
  const { nfts, isLoading, error, totalCount } = useUserNFTHistory({
    contractAddress: CONTRACT_ADDRESS,
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">My NFTs</h3>
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <NFTCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">My NFTs</h3>
        <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  // Empty State
  if (nfts.length === 0 && totalCount === 0) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">My NFTs</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3 animate-bounce">🖼️</div>
          <p className="text-gray-400">No NFTs owned yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Mint your first NFT to see it here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My NFTs</h3>
        <span className="text-sm text-gray-400">
          {totalCount} {totalCount === 1 ? "NFT" : "NFTs"} owned
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {nfts.map((nft, index) => (
          <div
            key={`${nft.contractAddress}-${nft.tokenId}`}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <NFTCard nft={nft} />
          </div>
        ))}
      </div>

      {totalCount > nfts.length && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {nfts.length} of {totalCount} NFTs
        </div>
      )}
    </div>
  );
};

/**
 * Individual NFT Card Component
 */
const NFTCard = ({ nft }: { nft: UserNFT }) => {
  const [imageError, setImageError] = useState(false);

  // Try to fetch NFT metadata from token URI
  const [metadata, setMetadata] = useState<{
    name?: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!nft.tokenUri || imageError) return;

      try {
        // Handle IPFS URIs
        let uri = nft.tokenUri;
        if (uri.startsWith("ipfs://")) {
          uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
        }

        const response = await fetch(uri);
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error("Failed to fetch NFT metadata:", err);
        setImageError(true);
      }
    };

    fetchMetadata();
  }, [nft.tokenUri, imageError]);

  // Fallback image if metadata fails
  const displayImage =
    metadata?.image || (imageError ? "/placeholder-nft.png" : nft.tokenUri);

  // Format token ID with leading zeros (optional, for display consistency)
  const formatTokenId = (tokenId: string): string => {
    return `#${parseInt(tokenId).toString()}`;
  };

  return (
    <div className="group relative bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all">
      {/* NFT Image */}
      <div className="aspect-square bg-gray-600 relative">
        {displayImage ? (
          <img
            src={displayImage}
            alt={`NFT #${nft.tokenId}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-2xl">🎨</span>
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono">
          {formatTokenId(nft.tokenId)}
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate">
          {metadata?.name || `MyProjectNFT #${parseInt(nft.tokenId)}`}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
        </p>
      </div>

      {/* View on Etherscan Link */}
      <a
        href={`https://sepolia.etherscan.io/token/${nft.contractAddress}?a=${nft.tokenId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
      >
        <span className="text-white text-sm font-semibold">View Details ↗</span>
      </a>
    </div>
  );
};
