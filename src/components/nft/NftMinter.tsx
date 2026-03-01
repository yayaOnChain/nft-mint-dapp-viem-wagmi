import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { formatEther } from "viem";
import { myNftAbi } from "../../abi/myNft";
import { useToast } from "../../hooks";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
} from "../ui";
import { contractAddress } from "../../config/env";

interface NftMinterProps {
  onMintSuccess?: () => void; // Optional callback to trigger after successful mint
}

/**
 * Component for minting NFTs from the MyProjectNFT contract
 */
export const NftMinter = ({ onMintSuccess }: NftMinterProps) => {
  const { address, isConnected, chain } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [toastId, setToastId] = useState<string | number | null>(null); // Track current toast ID for updates

  const toast = useToast();

  // Contract reads
  const {
    data: totalMinted,
    refetch: refetchTotalMinted,
    isLoading: isLoadingData,
  } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "totalMinted",
  });

  const { data: maxSupply } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "MAX_SUPPLY",
  });

  const { data: mintPrice } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "MINT_PRICE",
  });

  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Check user's ETH balance for validation
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
  });

  // Prepare write function for minting
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Toast effects
  useEffect(() => {
    if (isPending) {
      const id = toast.transaction.pending();
      setToastId(id);
    }

    if (isConfirmed && hash) {
      toast.transaction.success(hash, toastId ?? null, chain?.id);
      toast.success("NFT Minted Successfully!");

      // Refetch all relevant data
      refetchTotalMinted();
      refetchUserBalance();
      refetchEthBalance();

      // Trigger parent component to refresh NftGallery
      onMintSuccess?.();

      setQuantity(1);
    }

    if (writeError) {
      const msg = writeError.message.includes("User rejected")
        ? "You rejected the transaction in your wallet"
        : writeError.message;
      toast.transaction.error(msg, toastId ?? null);
    }
  }, [isPending, isConfirmed, hash, writeError, refetchTotalMinted, chain?.id]);

  // Calculations
  const totalCost = mintPrice ? mintPrice * BigInt(quantity) : 0n;

  const progressPercent =
    maxSupply && totalMinted
      ? Math.round((Number(totalMinted) / Number(maxSupply)) * 100)
      : 0;

  const canMint =
    isConnected &&
    mintPrice &&
    maxSupply &&
    totalMinted &&
    quantity >= 1 &&
    quantity <= 10 &&
    totalMinted + BigInt(quantity) <= maxSupply;

  const handleMint = () => {
    if (!writeContract || !mintPrice) return;
    toast.info("Confirm Transaction", `Minting ${quantity} NFT(s)`);

    // Execute mint with correct value and args
    writeContract({
      address: contractAddress,
      abi: myNftAbi,
      functionName: "mint",
      args: [BigInt(quantity)], // quantity as uint256
      value: totalCost, // Send ETH equal to MINT_PRICE * quantity
    });
  };

  if (!isConnected) {
    return (
      <Card>
        <p className="text-center text-gray-400">
          Connect your wallet to mint NFTs
        </p>
      </Card>
    );
  }

  // Loading state for initial data fetch
  const isInitialLoading =
    !totalMinted || !maxSupply || !mintPrice || !userBalance;

  // Show skeleton while loading contract data
  if (isInitialLoading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 max-w-md mx-auto">
        <Skeleton variant="text" className="w-1/2 h-8 mb-6" />
        <Skeleton variant="rect" className="w-full h-2 mb-6" />
        <Skeleton variant="rect" className="w-full h-12 mb-4" />
        <Skeleton variant="rect" className="w-full h-12 mb-4" />
        <Skeleton variant="rect" className="w-full h-12" />
      </div>
    );
  }

  return (
    <Card variant="elevated" className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Mint MyProjectNFT</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              Minted: {totalMinted?.toString() || "0"} /{" "}
              {maxSupply?.toString() || "1000"}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-linear-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Price Info */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">Price per NFT</p>
          <p className="text-xl font-mono font-bold">
            {mintPrice ? formatEther(mintPrice) : "0.01"} ETH
          </p>
        </div>

        {/* Quantity Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Quantity</label>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isPending || isConfirming}
            >
              -
            </Button>
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                )
              }
              disabled={isPending || isConfirming}
              className="w-16 text-center bg-gray-700 border border-gray-600 rounded py-1"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10 || isPending || isConfirming}
            >
              +
            </Button>
          </div>
        </div>

        {/* Total Cost */}
        <div className="p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-300">Total Cost</p>
          <p className="text-2xl font-mono font-bold text-purple-400">
            {mintPrice ? formatEther(totalCost) : "0.01"} ETH
          </p>
        </div>

        {/* User Balance Info */}
        <div className="text-sm text-gray-400">
          Your Balance:{" "}
          {ethBalance?.formatted
            ? `${ethBalance.formatted} ${ethBalance.symbol}`
            : "Loading..."}
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={!canMint || isPending || isConfirming || isLoadingData}
          isLoading={isPending || isConfirming}
          className="w-full"
          size="lg"
        >
          {isLoadingData
            ? "Loading..."
            : isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Confirming..."
                : "Mint NFT"}
        </Button>

        {/* User Info */}
        <div className="pt-4 border-t border-gray-700 text-xs text-gray-500">
          <p>
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <p>Your NFTs: {userBalance?.toString() || "0"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
