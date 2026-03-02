import { useState, useEffect } from "react";
import type { UserNFT } from "../../types";

/**
 * Display a single NFT card with image, name, token ID, and contract address.
 */
export const NftCard = ({ nft }: { nft: UserNFT }) => {
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

  // Determine if we should show the placeholder emoji
  const showPlaceholder = !nft.tokenUri || imageError;

  // Fallback image if metadata fails
  const displayImage =
    metadata?.image || (!showPlaceholder ? nft.tokenUri : null);

  // Format token ID with leading zeros (optional, for display consistency)
  const formatTokenId = (tokenId: string): string => {
    return `#${parseInt(tokenId).toString()}`;
  };

  return (
    <div className="group relative bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all">
      {/* NFT Image */}
      <div className="aspect-square bg-gray-600 relative">
        {displayImage && !showPlaceholder ? (
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
