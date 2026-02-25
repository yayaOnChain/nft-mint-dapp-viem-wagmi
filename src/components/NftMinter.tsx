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
import { RecentMintsDisplay } from "./RecentMintsDisplay";

// Replace with your actual deployed contract address
// Use type assertion to ensure it's a valid Ethereum address format
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export const NftMinter = () => {
  const { address, isConnected, chain } = useAccount();
  const [quantity, setQuantity] = useState<number>(1);

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

    const totalCost = getTotalCost();

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
    if (isConfirmed) {
      refetchTotalMinted();
      setQuantity(1); // Reset quantity after success
    }
  }, [isConfirmed, refetchTotalMinted]);

  // Loading state for initial data fetch
  const isLoadingData = !totalMinted || !maxSupply || !mintPrice;

  if (!isConnected) {
    return (
      <div className="p-6 border rounded-lg bg-gray-800 text-center">
        <p className="text-gray-300">Connect your wallet to mint NFTs</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-gray-800 max-w-md mx-auto">
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
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
            disabled={quantity <= 1}
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
            className="w-16 text-center bg-gray-700 border border-gray-600 rounded py-1 px-2"
          />
          <button
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
            disabled={
              quantity >= 10 ||
              !!(
                totalMinted &&
                maxSupply &&
                totalMinted + BigInt(quantity) >= maxSupply
              )
            }
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

      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={!canMint() || isWriting || isConfirming || isLoadingData}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
          ${
            !canMint() || isWriting || isConfirming
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 active:scale-[0.98]"
          }
        `}
      >
        {isLoadingData
          ? "Loading..."
          : isWriting
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming on Chain..."
              : "Mint NFT"}
      </button>

      {/* Status Messages */}
      <div className="mt-4 min-h-8">
        {writeError && (
          <p className="text-red-400 text-sm">
            Error:{" "}
            {writeError.message.includes("user rejected")
              ? "Transaction rejected"
              : writeError.message}
          </p>
        )}
        {isConfirmed && (
          <p className="text-green-400 text-sm">
            ✅ Minted! View on Etherscan: {hash?.slice(0, 6)}...
            {hash?.slice(-4)}
          </p>
        )}
        {!writeError && !isConfirmed && getValidationError() && (
          <p className="text-yellow-400 text-sm">⚠️ {getValidationError()}</p>
        )}
      </div>

      {/* Add real-time event listener display */}
      <RecentMintsDisplay />

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
