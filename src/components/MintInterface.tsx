import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMintNFT } from "../hooks/useMintNFT";
import { CONTRACT_CONFIG } from "../config/contract";

export const MintInterface = () => {
  const { address, isConnected } = useAccount();

  // Read contract state
  const { data: totalMinted } = useReadContract({
    address: CONTRACT_CONFIG.address.sepolia as `0x${string}`,
    abi: CONTRACT_CONFIG.abi,
    functionName: "totalMinted",
  });

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_CONFIG.address.sepolia as `0x${string}`,
    abi: CONTRACT_CONFIG.abi,
    functionName: "MINT_PRICE",
  });

  // Check user's ETH balance
  const { data: ethBalance } = useBalance({
    address,
  });

  // Mint hook
  const {
    mint,
    mintQuantity,
    setMintQuantity,
    isLoading,
    isConfirmed,
    txHash,
    error,
  } = useMintNFT({
    onSuccess: (hash) => {
      console.log("Mint successful:", hash);
      // Optional: show toast notification
    },
    onError: (err) => {
      console.error("Mint failed:", err.message);
      // Optional: show error toast
    },
  });

  // Calculate derived values
  const MAX_SUPPLY = 1000n; // From contract constant
  const remaining = MAX_SUPPLY - (totalMinted ?? 0n);
  const totalPrice = mintPrice ? mintPrice * BigInt(mintQuantity) : 0n;
  const canAfford =
    ethBalance?.value && totalPrice ? ethBalance.value >= totalPrice : false;
  const canMint = isConnected && remaining > 0n && canAfford && !isLoading;

  // Handle quantity change with validation
  const handleQuantityChange = (value: number) => {
    const clamped = Math.max(1, Math.min(10, value)); // Limit 1-10 per tx
    setMintQuantity(clamped);
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mint MyProjectNFT</h2>
        <ConnectButton showBalance={false} />
      </div>

      {/* Supply Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Minted: {totalMinted?.toString() ?? "0"}</span>
          <span>Remaining: {remaining.toString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Number(totalMinted ?? 0n) / 1000) * 100}%` }}
          />
        </div>
      </div>

      {/* Mint Controls */}
      <div className="space-y-4">
        {/* Quantity Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleQuantityChange(mintQuantity - 1)}
              disabled={mintQuantity <= 1 || isLoading}
              className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
            >
              -
            </button>
            <span className="text-xl font-semibold w-8 text-center">
              {mintQuantity}
            </span>
            <button
              onClick={() => handleQuantityChange(mintQuantity + 1)}
              disabled={mintQuantity >= 10 || isLoading}
              className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Price per NFT:</span>
          <span className="font-medium">
            {mintPrice ? formatEther(mintPrice) : "0.01"} ETH
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{totalPrice ? formatEther(totalPrice) : "0.01"} ETH</span>
        </div>

        {/* Balance Warning */}
        {isConnected && !canAfford && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            ⚠️ Insufficient ETH balance. You need at least{" "}
            {totalPrice ? formatEther(totalPrice) : "0.01"} ETH.
          </p>
        )}

        {/* Mint Button */}
        <button
          onClick={mint}
          disabled={!canMint}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${
              isLoading
                ? "bg-blue-400 cursor-wait"
                : canMint
                  ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                  : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isLoading
            ? "Confirming in wallet..."
            : !isConnected
              ? "Connect Wallet to Mint"
              : remaining === 0n
                ? "Sold Out"
                : !canAfford
                  ? "Insufficient ETH"
                  : `Mint ${mintQuantity} NFT${mintQuantity > 1 ? "s" : ""}`}
        </button>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌{" "}
            {error.message.includes("user rejected")
              ? "Transaction rejected in wallet"
              : error.message}
          </div>
        )}

        {isConfirmed && txHash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✅ Mint successful!{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-green-900"
            >
              View on Etherscan
            </a>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t text-xs text-gray-500 space-y-1">
        <p>• Max 10 NFTs per transaction</p>
        <p>• Mint price: 0.01 ETH each</p>
        <p>
          • Contract: {CONTRACT_CONFIG.address.sepolia?.slice(0, 6)}...
          {CONTRACT_CONFIG.address.sepolia?.slice(-4)}
        </p>
      </div>
    </div>
  );
};
