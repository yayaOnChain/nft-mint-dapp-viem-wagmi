// src/components/RecentMintsDisplay.tsx
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { MyNftAbi } from "../lib/abi/MyNFT";
import { useNftMintedEventsUnified } from "../hooks/useNftMintedEventsUnified";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export const RecentMintsDisplay = () => {
  // Updated unified hook returns loading/error states
  const unifiedResult = useNftMintedEventsUnified({
    contractAddress: CONTRACT_ADDRESS,
    onNewMint: (event) => {
      console.log("🎉 New mint detected:", event.tokenId.toString());
    },
  });
  const recentMints = unifiedResult.recentMints;
  const isLoading =
    "isLoading" in unifiedResult ? unifiedResult.isLoading : false;
  const error = "error" in unifiedResult ? unifiedResult.error : null;

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNftAbi,
    functionName: "MINT_PRICE",
  });

  const formatAddress = (addr: `0x${string}`) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? "bg-yellow-500" : "bg-green-500"}`}
        />
        Recent Mints (Live)
      </h3>

      {/* Show Loading Indicator */}
      {isLoading && !error && (
        <div className="text-sm text-gray-400 mb-3">
          Fetching latest events...
        </div>
      )}

      {/* Show Error Message if any */}
      {error && (
        <div className="mb-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-400">
          ⚠️ {error}. Using 10-block range limit (Free Tier).
        </div>
      )}

      {/* Content */}
      {recentMints.length === 0 ? (
        <p className="text-gray-500 text-sm">Waiting for mint activity...</p>
      ) : (
        <ul className="space-y-3">
          {recentMints.map((mint, index) => (
            <li
              key={`${mint.txHash}-${mint.tokenId.toString()}`}
              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                  #{mint.tokenId.toString()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Minted by {formatAddress(mint.minter)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Token ID: {mint.tokenId.toString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {formatTime(mint.timestamp)}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${mint.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View TX ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Price Context */}
      {mintPrice && (
        <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
          Mint Price: {formatEther(mintPrice)} ETH each
        </div>
      )}
    </div>
  );
};
