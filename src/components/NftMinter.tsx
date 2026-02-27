import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { formatEther } from "viem";
import { MyNftAbi } from "../lib/abi/MyNFT";
// import { RecentMintsDisplay } from "./RecentMintsDisplay";
import { useToast } from "../hooks/useToast";
import { Skeleton } from "./ui/Skeleton";

// Replace with your actual deployed contract address
// Use type assertion to ensure it's a valid Ethereum address format
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export const NftMinter = () => {
  const { address, isConnected, chain } = useAccount();
  const [quantity, setQuantity] = useState<number>(1);
  const [toastId, setToastId] = useState<string | number | null>(null); // Track current toast ID for updates

  const toast = useToast(); // Initialize toast hook

  // Create debounced version of error toast
  const showErrorDebounced = toast.createDebouncedToast("error", 1000);

  // Read contract constants and state
  const { data: totalMinted, refetch: refetchTotalMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNftAbi,
    functionName: "totalMinted",
  });

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNftAbi,
    functionName: "MAX_SUPPLY",
  });

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNftAbi,
    functionName: "MINT_PRICE",
  });

  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNftAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Check user's ETH balance for validation
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Prepare write function for minting
  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Show toast on transaction status changes
  useEffect(() => {
    if (isWriting) {
      // toast.transaction.pending();
      const id = toast.transaction.pending();
      setToastId(id);
    }
  }, [isWriting]);

  useEffect(() => {
    if (writeError) {
      const errorMsg = writeError.message.includes("user rejected")
        ? "You rejected the transaction"
        : writeError.message;
      toast.transaction.error(errorMsg, toastId ?? null);
    }
  }, [writeError]);

  // Calculate total cost in ETH (BigInt arithmetic)
  const getTotalCost = (): bigint => {
    if (!mintPrice) return 0n;
    return mintPrice * BigInt(quantity);
  };

  // Calculate remaining supply
  const getRemainingSupply = (): number => {
    if (!totalMinted || !maxSupply) return 0;
    return Number(maxSupply - totalMinted);
  };

  // Handle mint action
  const handleMint = () => {
    if (!writeContract || !mintPrice) return;

    // Validation errors won't spam user
    if (!canMint()) {
      showErrorDebounced("Cannot mint", getValidationError() || "");
      return;
    }

    const totalCost = getTotalCost();

    // Show confirmation toast before wallet prompt
    toast.info(
      "Confirm Transaction",
      `Minting ${quantity} NFT(s) for ${formatEther(totalCost)} ETH`,
    );

    // Success toast also debounced
    toast.success("Mint initiated", "Check your wallet");

    // Execute mint with correct value and args
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MyNftAbi,
      functionName: "mint",
      args: [BigInt(quantity)], // quantity as uint256
      value: totalCost, // Send ETH equal to MINT_PRICE * quantity
    });
  };

  // Validation: Check if mint is possible
  const canMint = () => {
    if (!isConnected || !mintPrice || !maxSupply || !totalMinted) return false;
    if (quantity < 1 || quantity > 10) return false; // Limit per transaction
    if (totalMinted + BigInt(quantity) > maxSupply) return false;

    const totalCost = getTotalCost();
    if (ethBalance?.value && ethBalance.value < totalCost) return false;

    return true;
  };

  // UI: Show error messages
  const getValidationError = (): string | null => {
    if (!isConnected) return "Please connect your wallet";
    if (!chain) return "Please select a network";
    if (quantity < 1) return "Quantity must be at least 1";
    if (quantity > 10) return "Max 10 NFTs per transaction";

    if (
      totalMinted &&
      maxSupply &&
      totalMinted + BigInt(quantity) > maxSupply
    ) {
      return `Only ${getRemainingSupply()} NFTs remaining`;
    }

    const totalCost = getTotalCost();
    if (ethBalance?.value && ethBalance.value < totalCost) {
      return `Insufficient ETH. Need ${formatEther(totalCost)} ETH`;
    }

    return null;
  };

  // Refetch data after successful mint
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.transaction.success(hash, toastId ?? null, chain?.id);
      toast.success("NFT Minted Successfully!", `Token ID received`);
      refetchTotalMinted();
      setQuantity(1);
    }
  }, [isConfirmed, hash, refetchTotalMinted, chain?.id]);

  // Loading state for initial data fetch
  const isLoadingData = !totalMinted || !maxSupply || !mintPrice;

  // Show skeleton while loading contract data
  if (isLoadingData) {
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

  if (!isConnected) {
    return (
      <div className="p-6 border rounded-lg bg-gray-800 text-center">
        <p className="text-gray-300">Connect your wallet to mint NFTs</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-gray-800 max-w-md mx-auto transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center">Mint MyProjectNFT</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Minted: {totalMinted?.toString() || "0"} /{" "}
            {maxSupply?.toString() || "1000"}
          </span>
          <span>
            {Math.round(
              (Number(totalMinted || 0) / Number(maxSupply || 1000)) * 100,
            )}
            %
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-linear-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(Number(totalMinted || 0) / Number(maxSupply || 1000)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Mint Price Display */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-400">Price per NFT</p>
        <p className="text-xl font-mono font-bold">
          {mintPrice ? formatEther(mintPrice) : "0.01"} ETH
        </p>
      </div>

      {/* Quantity Selector */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || isWriting || isConfirming}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            -
          </button>
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
            disabled={isWriting || isConfirming}
            className="w-16 text-center bg-gray-700 border border-gray-600 rounded py-1 px-2 disabled:opacity-50"
          />
          <button
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            disabled={quantity >= 10 || isWriting || isConfirming}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Max 10 per transaction</p>
      </div>

      {/* Total Cost Display */}
      <div className="mb-6 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
        <p className="text-sm text-purple-300">Total Cost</p>
        <p className="text-2xl font-mono font-bold text-purple-400">
          {mintPrice ? formatEther(getTotalCost()) : "0.01"} ETH
        </p>
      </div>

      {/* User Balance Info */}
      <div className="mb-4 text-sm text-gray-400">
        Your Balance:{" "}
        {ethBalance?.formatted
          ? `${ethBalance.formatted} ${ethBalance.symbol}`
          : "Loading..."}
      </div>

      {/* Mint Button with Loading States */}
      <button
        onClick={handleMint}
        disabled={!canMint() || isWriting || isConfirming || isLoadingData}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform 
          ${
            !canMint() || isWriting || isConfirming
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:scale-[0.98]"
          }
        `}
      >
        {isLoadingData ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </span>
        ) : isWriting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Confirm in Wallet...
          </span>
        ) : isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-pulse h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              />
            </svg>
            Confirming on Chain...
          </span>
        ) : (
          "Mint NFT"
        )}
      </button>

      {/* Status Messages */}
      <div className="mt-4 min-h-8">
        {!writeError && !isConfirmed && getValidationError() && (
          <p className="text-yellow-400 text-sm animate-fadeIn">
            ⚠️ {getValidationError()}
          </p>
        )}
      </div>

      {/* Add real-time event listener display */}
      {/* <RecentMintsDisplay /> */}

      {/* User Info Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500">
        <p>
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <p>Your NFTs: {userBalance?.toString() || "0"}</p>
      </div>
    </div>
  );
};
