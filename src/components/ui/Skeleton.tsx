import { cn } from "../../lib/utils";

/**
 * Base skeleton component for loading states
 */
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect" | "card";
}

export const Skeleton = ({ className, variant = "rect" }: SkeletonProps) => {
  const baseStyles = "animate-pulse bg-gray-700";

  const variantStyles = {
    text: "h-4 w-full rounded",
    circle: "rounded-full",
    rect: "rounded-lg",
    card: "rounded-xl",
  };

  return <div className={cn(baseStyles, variantStyles[variant], className)} />;
};

/**
 * NFT Card Skeleton - for gallery loading
 */
export const NFTCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      {/* Image placeholder */}
      <Skeleton variant="rect" className="aspect-square w-full" />

      {/* Info section */}
      <div className="p-3 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  );
};

/**
 * Table Row Skeleton - for transaction history
 */
export const TransactionRowSkeleton = () => {
  return (
    <tr className="border-b border-gray-700/50">
      <td className="py-3">
        <Skeleton variant="text" className="w-16" />
      </td>
      <td className="py-3">
        <Skeleton variant="rect" className="w-20 h-6" />
      </td>
      <td className="py-3">
        <Skeleton variant="text" className="w-24" />
      </td>
      <td className="py-3">
        <Skeleton variant="text" className="w-32" />
      </td>
    </tr>
  );
};

/**
 * Mint Form Skeleton - for NftMinter component
 */
export const MintFormSkeleton = () => {
  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 max-w-md mx-auto space-y-4">
      <Skeleton variant="text" className="w-1/2 h-8" />
      <Skeleton variant="rect" className="w-full h-2" />
      <Skeleton variant="rect" className="w-full h-12" />
      <Skeleton variant="rect" className="w-full h-12" />
      <Skeleton variant="rect" className="w-full h-12" />
    </div>
  );
};
