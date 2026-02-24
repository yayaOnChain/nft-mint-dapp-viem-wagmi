import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { nftAbi } from "../lib/abi/nft"; // Import the ABI for your NFT contract

// Replace with your actual deployed contract address
const CONTRACT_ADDRESS = import.meta.env
  .VITE_NFT_CONTRACT_ADDRESS as `0x${string}`;

export const NftMinter = () => {
  // 1. Check if wallet is connected
  const { address, isConnected } = useAccount();

  // 2. Read data from contract (e.g., Total Supply)
  // Wagmi automatically refetches when chain/account changes
  const { data: totalSupply, isLoading: isReading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "totalSupply",
  });

  // 3. Prepare write function (e.g., Mint NFT)
  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  // 4. Wait for transaction receipt to confirm success
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle Mint Action
  const handleMint = () => {
    if (!writeContract) return;

    // Call the write function with contract details
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: nftAbi,
      functionName: "mint",
      // If mint requires value (ETH), add it here:
      // value: parseEther('0.01'),
    });
  };

  // UI Rendering Logic
  if (!isConnected) {
    return (
      <div className="p-4 bg-red-100 text-red-800">
        Please connect your wallet first.
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">NFT Minting Interface</h2>

      {/* Display Read Data */}
      <div className="mb-4">
        <p className="text-gray-600">Total Supply:</p>
        {isReading ? (
          <span className="text-sm text-gray-400">Loading...</span>
        ) : (
          <span className="text-lg font-mono">
            {totalSupply?.toString() || "0"}
          </span>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleMint}
        disabled={isWriting || isConfirming}
        className={`w-full py-2 px-4 rounded text-white font-semibold 
          ${isWriting || isConfirming ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
        `}
      >
        {isWriting
          ? "Confirm in Wallet..."
          : isConfirming
            ? "Confirming..."
            : "Mint NFT"}
      </button>

      {/* Status Messages */}
      <div className="mt-4 text-sm">
        {writeError && (
          <p className="text-red-500">Error: {writeError.message}</p>
        )}
        {isConfirmed && (
          <p className="text-green-500">
            Transaction Successful! Hash: {hash?.slice(0, 10)}...
          </p>
        )}
      </div>

      {/* Debug: Show User Address */}
      <p className="mt-4 text-xs text-gray-400">Connected: {address}</p>
    </div>
  );
};
