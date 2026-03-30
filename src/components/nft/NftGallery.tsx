import { useUserNFTHistory } from "@/hooks";
import { NFTCardSkeleton } from "@/components/ui";
import { NftCard } from "@/components/nft/NftCard";
import { Button } from "@/components/ui/Button";
import { contractAddress } from "@/config/env";

interface NftGalleryProps {
  refreshKey?: number; // Optional prop to trigger re-fetching NFTs
}

/**
 * Display user's owned NFTs in a gallery format with pagination
 */
export const NftGallery = ({ refreshKey = 0 }: NftGalleryProps) => {
  const { nfts, isLoading, error, totalCount, hasMore, loadMore } =
    useUserNFTHistory({
      contractAddress,
      refreshKey,
    });

  // Loading State
  if (isLoading && nfts.length === 0) {
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
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My NFTs</h3>
        <span className="text-sm text-gray-400">
          {nfts.length} of {totalCount} {totalCount === 1 ? "NFT" : "NFTs"} owned
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {nfts.map((nft, index) => (
          <div
            key={`${nft.contractAddress}-${nft.tokenId}`}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <NftCard nft={nft} />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Load More ({nfts.length} / {totalCount})
          </Button>
        </div>
      )}

      {/* Show all loaded message */}
      {!hasMore && nfts.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          All {totalCount} {totalCount === 1 ? "NFT" : "NFTs"} loaded
        </div>
      )}
    </div>
  );
};
