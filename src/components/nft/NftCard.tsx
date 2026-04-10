import { useState, useEffect } from "react";
import type { UserNFT } from "@/types";
import { ipfsToHttpUrl } from "@/services/ipfsService";
import { IPFS_GATEWAYS } from "@/lib/constants";

/**
 * Display a single NFT card with image, name, token ID, and contract address.
 * Uses multiple IPFS gateways with fallback logic for better reliability.
 */
export const NftCard = ({ nft }: { nft: UserNFT }) => {
  const [imageError, setImageError] = useState(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);

  // Try to fetch NFT metadata from token URI
  const [metadata, setMetadata] = useState<{
    name?: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!nft.tokenUri || imageError) return;

      try {
        // Convert IPFS URI to HTTPS URL using current gateway
        let uri = nft.tokenUri;
        if (uri.startsWith("ipfs://")) {
          uri = ipfsToHttpUrl(uri, currentGatewayIndex);
        }

        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error("Failed to fetch NFT metadata:", err);

        // Try next gateway if available
        if (currentGatewayIndex < IPFS_GATEWAYS.length - 1) {
          setCurrentGatewayIndex((prev) => prev + 1);
        } else {
          setImageError(true);
        }
      }
    };

    fetchMetadata();
  }, [nft.tokenUri, imageError, currentGatewayIndex]);

  // Determine if we should show the placeholder emoji
  const showPlaceholder = !nft.tokenUri || imageError;

  // Determine image URL with gateway fallback
  const getDisplayImage = (): string | null => {
    if (metadata?.image) {
      if (metadata.image.startsWith("ipfs://")) {
        return ipfsToHttpUrl(metadata.image, currentGatewayIndex);
      }
      return metadata.image;
    }

    if (nft.tokenUri && !showPlaceholder) {
      if (nft.tokenUri.startsWith("ipfs://")) {
        return ipfsToHttpUrl(nft.tokenUri, currentGatewayIndex);
      }
      return nft.tokenUri;
    }

    return null;
  };

  const displayImage = getDisplayImage();

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
            onError={() => {
              // Try next gateway on image load error
              if (currentGatewayIndex < IPFS_GATEWAYS.length - 1) {
                setCurrentGatewayIndex((prev) => prev + 1);
              } else {
                setImageError(true);
              }
            }}
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
